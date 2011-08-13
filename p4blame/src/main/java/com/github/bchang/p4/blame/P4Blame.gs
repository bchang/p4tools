package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.Diff2
uses com.github.bchang.p4.base.FileLog
uses com.github.bchang.p4.base.P4Client
uses com.github.bchang.p4.base.P4Factory
uses com.github.bchang.p4.base.Path
uses com.github.bchang.p4.base.PathRange
uses com.github.bchang.p4.base.PathRev
uses java.util.ArrayList
uses java.util.Arrays
uses java.util.Map
uses java.lang.Integer
uses gw.util.AutoMap
uses gw.util.Pair

// need caching
// better error handling for entry point, handle revs
class P4Blame implements IP4Blame
{
  var _p4 : P4Client
  var _logBacktracks : boolean as LogBacktracks = false
  var _listeners = new ArrayList<IP4BlameListener>()
  var _path : Path
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

  override function forPathNoStart(pathStr : String) : IP4BlameLine[] {
    var fstatDepotFile = _p4.fstat(pathStr)["depotFile"]
    if (fstatDepotFile == null) {
      throw "No such file in depot: ${pathStr}"
    }
    _path = P4Factory.createPath(pathStr)
    if (_path typeis PathRev) {
      _path = P4Factory.createPath(fstatDepotFile, _path.Rev)
    }
    else {
      _path = P4Factory.createPath(fstatDepotFile)
    }
    _recordList = new RecordList(_path as String, _p4.print(_path).map( \ line -> new Record(line) ))
    return _recordList.toArray(new Record[_recordList.size()])
  }

  override function start() {
    backtrackWithinPath(_recordList, _path, 0)
  }

  function forPath(pathStr : String) : RecordList {
    var start = java.lang.System.nanoTime()

    forPathNoStart(pathStr)
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

      workingList.resetAllFlags()
      var origWorkingList = workingList.dup()

      if (isFirstRevisionForPath(logEntry)) {
        workingList.flagAllLinesAsPotentiallyFromInteg()
      }
      else {
        for (diffEntry in diff2(filelog[i].PathRev, filelog[i + 1].PathRev)) {
          // simulate the change (backwards)
          var removedRecs = backtrack(workingList, diffEntry)
          for (removedRec in removedRecs) {
            removedRec.foundSourceRev(logEntry)
            removedRec.FlaggedForInterest = true
          }
        }
      }

      for (source in logEntry.Sources) {
        backtrackIntoIntegSource(origWorkingList.dup(), source, logEntry, recursionDepth)
      }

      if (isFirstRevisionForPath(logEntry)) {
        recordList.setAllPendingRecords(logEntry)
        break
      }
    }
  }

  function backtrackIntoIntegSource(recordList : RecordList, sourceDetail : FileLog.Entry.Detail, logEntry : FileLog.Entry, recursionDepth : int) {
    var forkedList = recordList.dup()
    var sourcePathRev = sourceDetail.PathRev
    if (sourcePathRev typeis PathRange) {
      sourcePathRev = sourcePathRev.EndPathRev
    }

    // mask unflagged lines, to be ignored when exploring the source branch
    for (rec in forkedList index i) {
      if (rec != null and !rec.FlaggedForInterest) {
        forkedList.set(i, null)
      }
    }

    for (diffEntry in diff2(logEntry.PathRev, sourcePathRev)) {
      backtrack(forkedList, diffEntry)
    }
    for (rec in forkedList index i) {
      if (rec != null) {
        rec.resetSourceRev()
      }
    }
    backtrackWithinPath( forkedList, sourcePathRev, recursionDepth + 1 )
  }

  private function backtrack(records : RecordList, diffEntry : Diff2.Entry) : List<Record> {
    var removedRecs = new ArrayList<Record>()
    if (diffEntry.Op == "c" or diffEntry.Op == "d") {
      for (n in diffEntry.LeftRange) {
        var indexToRemove = (diffEntry.Op == "d") ? diffEntry.RightRange.start : diffEntry.RightRange.start - 1
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

}
