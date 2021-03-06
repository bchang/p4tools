package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.*
uses java.lang.*
uses java.util.*
uses gw.util.AutoMap
uses gw.util.Pair
uses gw.lang.reflect.interval.IntegerInterval
uses com.github.bchang.p4.base.P4Blame.ChangeInfo
uses com.github.bchang.p4.base.P4Blame.Line
uses com.github.bchang.p4.base.P4Blame.Listener

// need caching
// better error handling for entry point, handle revs
class P4Blame implements com.github.bchang.p4.base.P4Blame
{
  var _p4 : P4Client
  var _logBacktracks : boolean as LogBacktracks = false
  var _listeners = new ArrayList<Listener>()
  var _path : Path
  var _recordList : RecordList as RecordList

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

  override function addListener(listener : Listener) {
    _listeners.add(listener)
  }

  function setup(pathStr : String) : List<Line> {
    var fstatDepotFile : String
    fstatDepotFile = _p4.fstat(pathStr.asPath())["depotFile"]
    if (fstatDepotFile == null) {
      throw new IllegalArgumentException("No such file in depot: ${pathStr}")
    }
    var path = Path.create(pathStr)
    if (path typeis PathRev) {
      path = PathRev.create(fstatDepotFile, path.Rev)
    }
    else {
      path = Path.create(fstatDepotFile)
    }
    return setup(path)
  }

  override function setup(path : Path) : List<Line> {
    _path = path
    var lines = _p4.print(path)
    var records = new ArrayList<Record>()
    for (line in lines index i) {
      records.add(new Record(line, i))
    }
    _recordList = new RecordList(_path as String, records)
    return _recordList
  }

  override function start() {
    backtrackWithinPath(_recordList, _path, 0)
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

  private function backtrackWithinPath(recordList : RecordList, pathrev : Path, recursionDepth : int) {
    if (LogBacktracks) {
      print("${indent(recursionDepth)}backtracking into: ${pathrev}")
    }
    var workingList = recordList.dup()
    var filelog = filelog(pathrev)

    for (logEntry in filelog index i) {
      if (recordList.isComplete()) {
        break
      }
      if (LogBacktracks) {
        print("${indent(recursionDepth)}  " + logEntry.PathRev)
      }
      for (listener in _listeners) {
        listener.status("Visiting " + filelog[i].PathRev)
      }

      var origWorkingList = workingList.dup()
      var recordsChangedWithinPath = new HashSet<Record>()

      if (isFirstRevisionForPath(logEntry)) {
        for (rec in workingList) {
          if (rec != null) {
            recordsChangedWithinPath.add(rec)
          }
        }
      }
      else {
        for (diffEntry in diff2(filelog[i].PathRev, filelog[i + 1].PathRev)) {
          // simulate the change (backwards)
          recordsChangedWithinPath.addAll(backtrack(workingList, diffEntry))
        }
      }

      for (source in logEntry.Sources) {
        backtrackIntoIntegSource(origWorkingList.dup(), source, logEntry, recordsChangedWithinPath, recursionDepth)
      }

      if (recordsChangedWithinPath.Count > 0) {
        var changeInfo = new ChangeInfoImpl(logEntry)
        for (rec in recordsChangedWithinPath) {
          rec.discovered(changeInfo)
          for (listener in _listeners) {
            listener.lineDiscovered(rec.Id, rec.ChangeInfo)
          }
        }
      }
    }
  }

  function backtrackIntoIntegSource(forkedList : RecordList, sourceDetail : FileLog.EntryDetail, logEntry : FileLog.Entry, recordsChangedWithinPath : HashSet<Record>, recursionDepth : int) {
    var sourcePathRev = sourceDetail.PathRev.EndPathRev

    // mask unflagged lines, to be ignored when exploring the source branch
    for (rec in forkedList index i) {
      if (rec != null && !recordsChangedWithinPath.contains(rec)) {
        forkedList.set(i, null)
      }
    }

    for (diffEntry in diff2(logEntry.PathRev, sourcePathRev)) {
      backtrack(forkedList, diffEntry)
    }
    for (rec in forkedList) {
      if (rec != null) {
        recordsChangedWithinPath.remove(rec)
      }
    }
    backtrackWithinPath( forkedList, sourcePathRev, recursionDepth + 1 )
  }

  private function backtrack(records : RecordList, diffEntry : Diff2.Entry) : List<Record> {
    var removedRecs = new ArrayList<Record>()
    if (diffEntry.Op == "c" or diffEntry.Op == "d") {
      for (n in diffEntry.LeftRange) {
        var indexToRemove : int = (diffEntry.Op == "d") ? diffEntry.RightRange.first() : diffEntry.RightRange.first() - 1
        var removedRec = records.remove(indexToRemove)
        if (removedRec != null) removedRecs.add(removedRec)
      }
    }
    if (diffEntry.Op == "c" or diffEntry.Op == "a") {
      for (n in diffEntry.RightRange) {
        records.add(n - 1, null)
      }
    }
    return removedRecs
  }

  private function isFirstRevisionForPath(logEntry : FileLog.Entry) : boolean {
    return logEntry.Op == "add" or logEntry.Op == "branch"
  }

  private function indent(n : int) : String {
    var bytes = new byte[n << 3]
    Arrays.fill(bytes, 32 as byte)
    return new String(bytes)
  }

  class ChangeInfoImpl implements ChangeInfo {
    var _change : int as Change
    var _date : String as Date
    var _user : String as User
    var _path : String as Path
    var _lazyDescription = LazyVar.make(\ -> {
      var objs = _p4.runForObjects({"change", "-o", Change as String})
      return objs.single().Dict["Description"].trim()
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
