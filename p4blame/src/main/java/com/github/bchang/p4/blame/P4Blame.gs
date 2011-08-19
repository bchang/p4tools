package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.*
uses java.lang.*
uses java.util.*
uses gw.util.AutoMap
uses gw.util.Pair
uses gw.util.concurrent.LazyVar

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
    var fstat = _p4.fstat(pathStr)
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
      for (n in Integer.range(cachedFilelog.Count - pathrev.Rev, cachedFilelog.Count - 1)) {
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
    var traversalQueue = new LinkedList<Pair<RecordList, PathRev>>()
    traversalQueue.add(new Pair<RecordList, PathRev>(recordList, pathrev))
    eachInTreeBreadthFirst(traversalQueue)
  }

  private function eachInTreeBreadthFirst(traversalQueue : LinkedList<Pair<RecordList, PathRev>>) {

    while (traversalQueue.Count > 0) {
      var pair = traversalQueue.removeFirst()
      var recordList = pair.First
      var pathrev = pair.Second

      var records = new HashSet<Record>()
      for (rec in recordList) {
        if (rec != null) {
          records.add(rec)
        }
      }

      var logEntry = filelog(pathrev)[0]
      var sourcePathRevs = pathRev.combinedSourcePathRevs(logEntry)
      var workingLists = new RecordList[sourcePathRevs.Count]
      for (sourcePathRev in sourcePathRevs index i) {
        workingLists[i] = backtrack(recordList, pathrev, sourcePathRev, records)
      }
      if (records.Count > 0) {
        var changeInfo = new ChangeInfo(logEntry)
        for (rec in records) {
          rec.discovered(logEntry, changeInfo)
          for (listener in _listeners) {
            listener.lineDiscovered(rec)
          }
        }
      }

      for (sourcePathRev in sourcePathRevs index i) {
        if (!workingLists[i].isComplete()) {
          traversalQueue.add(new Pair<RecordList, PathRev>(workingLists[i], sourcePathRev))
        }
      }
    }

  }

  private function backtrack(recordList : RecordList, pathrev : PathRev, sourcePathRev : PathRev, records : HashSet<Record>) : RecordList {
    var workingList = recordList.dup()
    for (diffEntry in diff2(pathrev, sourcePathRev)) {
      if (diffEntry.Op == "c" or diffEntry.Op == "d") {
        for (n in diffEntry.LeftRange) {
          var indexToRemove = (diffEntry.Op == "d") ? diffEntry.RightRange.start : diffEntry.RightRange.start - 1
          workingList.remove(indexToRemove)
        }
      }
      if (diffEntry.Op == "c" or diffEntry.Op == "a") {
        for (n in diffEntry.RightRange) {
          workingList.add(n - 1, null)
        }
      }
    }
    for (rec in workingList) {
      if (rec != null) {
        records.remove(rec)
      }
    }
    return workingList
  }

  private function isFirstRevisionForPath(logEntry : FileLog.Entry) : boolean {
    return logEntry.Op == "add" or logEntry.Op == "branch"
  }

  private function indent(n : int) : String {
    var bytes = new byte[n << 3]
    Arrays.fill(bytes, 32 as byte)
    return new String(bytes)
  }

  class ChangeInfo implements IP4ChangeInfo {
    var _change : int as Change
    var _date : String as Date
    var _user : String as User
    var _path : String as Path
    var _lazyDescription = LazyVar<String>.make(\ -> {
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
