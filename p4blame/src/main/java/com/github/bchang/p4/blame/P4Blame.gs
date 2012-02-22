package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.*
uses java.lang.*
uses java.util.*
uses gw.util.AutoMap
uses gw.util.Pair
uses gw.lang.reflect.interval.IntegerInterval
uses gw.util.concurrent.LocklessLazyVar

// need caching
// better error handling for entry point, handle revs
class P4Blame implements IP4Blame
{
  var _p4 : P4Client
  var _logBacktracks : boolean as LogBacktracks = false
  var _listeners = new ArrayList<IP4BlameListener>()
  var _path : PathRev
  var _recordList : RecordList

  var _filelogCache : Map<String, List<FileLog.Entry>> = {}
  var _diff2Cache = new AutoMap<Pair<Path, Path>, List<Diff2.Entry>>(\ pair -> {
    return _p4.diff2(pair.First, pair.Second)
  })

  construct() {
    this(P4Factory.createP4())
  }

  construct(p4 : P4Client) {
    _p4 = p4
  }

  override function addListener(listener : IP4BlameListener) {
    _listeners.add(listener)
  }

  override function setup(pathStr : String) : String[] {
    var fstat = _p4.fstat(pathStr.asPath())
    var fstatDepotFile = fstat["depotFile"]
    if (fstatDepotFile == null) {
      throw new IllegalArgumentException("No such file in depot: ${pathStr}")
    }
    if (_path typeis PathRev) {
      _path = P4Factory.createPath(fstatDepotFile, _path.Rev)
    }
    else {
      _path = P4Factory.createPath(fstatDepotFile, fstat["headRev"].toInt())
    }
    var lines = _p4.print(_path)
    var records = new ArrayList<Record>()
    for (line in lines index i) {
      records.add(new Record(line, i))
    }
    _recordList = new RecordList(_path as String, records)
    return lines.toArray(new String[lines.Count])
  }

  override function start() {
    backtrackFromNode(_recordList, _path)
  }

  function forPath(pathStr : String) : RecordList {
    var start = java.lang.System.nanoTime()

    setup(pathStr)
    start()

    print("time elapsed: " + ((java.lang.System.nanoTime() - start) / 1000 / 1000) + " ms")

    return _recordList
  }

  private function filelog(pathrev : Path) : List<FileLog.Entry> {
    var cachedFilelog = _filelogCache[pathrev.Path]
    if (cachedFilelog == null or (pathrev typeis PathRev and pathrev.Rev > cachedFilelog.Count)) {
      cachedFilelog = _p4.filelog(pathrev)
      _filelogCache[pathrev.Path] = cachedFilelog
    }
    if (pathrev typeis PathRev and pathrev.Rev > 0) {
      // get a "sublist" beginning at cachedFilelog.length - pathrev.Rev
      var list : List<FileLog.Entry> = {}
      for (n in new IntegerInterval(cachedFilelog.Count - pathrev.Rev, cachedFilelog.Count - 1)) {
        list.add(cachedFilelog[n])
      }
      return list
    }
    return cachedFilelog
  }

  private function diff2(left : Path, right : Path) : List<Diff2.Entry> {
    return _diff2Cache[new Pair<Path, Path>(left, right)]
  }

  private function backtrackFromNode(recordList : RecordList, pathrev : PathRev) {
    var traversalQ = new LinkedList<HistoryGraphNode>()
    traversalQ.add(new HistoryGraphNode(recordList, pathrev))
    eachInGraphBreadthFirst(traversalQ)
  }

  private function eachInGraphBreadthFirst(traversalQ : LinkedList<HistoryGraphNode>) {
    while (traversalQ.Count > 0) {
      var node = traversalQ.removeFirst()

      var sourceNodes = node.getSourceNodes()
      for (sourceNode in sourceNodes) {
        sourceNode.backtrackFrom(node)
      }

      node.reportDiscoveries()

      for (sourceNode in sourceNodes) {
        if (sourceNode.shouldContinue()) {
          traversalQ.add(sourceNode)
        }
      }
    }
  }

  private class HistoryGraphNode {
    var _recordList : RecordList
    var _logEntry : FileLog.Entry
    var _pathrev : PathRev as PathRev

    var _records = LocklessLazyVar<HashSet<Record>>.make(\ -> {
      var records = new HashSet<Record>()
      for (rec in _recordList) {
        if (rec != null) {
          records.add(rec)
        }
      }
      return records
    })

    property get RecordsForNode() : HashSet<Record> {
      return _records.get()
    }

    construct(cRecordList : RecordList, cPathRev : PathRev) {
      _recordList = cRecordList
      _pathrev = cPathRev
      _logEntry = filelog(cPathRev)[0]
    }

    function shouldContinue() : boolean {
      return !_recordList.isComplete()
    }

    function reportDiscoveries() {
      if (RecordsForNode.Count > 0) {
        var changeInfo = new ChangeInfo(_logEntry)
        for (rec in RecordsForNode) {
          rec.discovered(_logEntry, changeInfo)
          for (listener in _listeners) {
            listener.lineDiscovered(rec)
          }
        }
      }
    }

    function getSourceNodes() : List<HistoryGraphNode> {
      var ret = new ArrayList<HistoryGraphNode>()
      if (_pathrev.Rev > 1) {
        ret.add(new HistoryGraphNode(_recordList.dup(), P4Factory.createPath(_pathrev.Path, _pathrev.Rev - 1)))
      }
      for (sourceDetail in _logEntry.Sources) {
        ret.add(new HistoryGraphNode(_recordList.dup(), sourceDetail.PathRev.EndPathRev))
      }
      return ret
    }

    function backtrackFrom(targetNode : HistoryGraphNode) {
      for (diffEntry in diff2(targetNode.PathRev, _pathrev)) {
        if (diffEntry.Op == "c" or diffEntry.Op == "d") {
          for (n in diffEntry.LeftRange) {
            var indexToRemove : int = (diffEntry.Op == "d") ? diffEntry.RightRange.first() : diffEntry.RightRange.first() - 1
            _recordList.remove(indexToRemove)
          }
        }
        if (diffEntry.Op == "c" or diffEntry.Op == "a") {
          for (n in diffEntry.RightRange) {
            _recordList.add(n - 1, null)
          }
        }
      }
      for (rec in _recordList) {
        if (rec != null) {
          targetNode.RecordsForNode.remove(rec)
        }
      }
    }
  }

  class ChangeInfo implements IP4ChangeInfo {
    var _change : int as Change
    var _date : String as Date
    var _user : String as User
    var _path : String as Path
    var _lazyDescription = LocklessLazyVar<String>.make(\ -> {
      var desc : LinkedList<String>
      _p4.exec("change -o ${Change}", \ line -> {
        if (desc != null) {
          if (line.startsWith("\t")) {
            line = line.substring(1) // ignore the leading \t
          }
          desc.add(line)
        } else if (line.startsWith("Description:")) {
          desc = new LinkedList<String>()
        }
      })
      if (desc == null) {
        throw new IllegalStateException("could not find descBuilder for Change ${Change}")
      }
      while (desc.Count > 0 && desc.Last.trim().length() == 0) {
        desc.removeLast()
      }
      var descBuilder = new StringBuilder()
      descBuilder.append(desc.join("\n"))
      return descBuilder.toString()
    })

    construct(logEntry : FileLog.Entry) {
      Change = logEntry.Change
      Date = logEntry.Date
      User = logEntry.User
      Path = logEntry.PathRev as String
    }

    override property get Description() : String {
      return _lazyDescription.get()
    }
  }

}
