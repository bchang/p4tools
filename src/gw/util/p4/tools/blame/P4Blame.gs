package gw.util.p4.tools.blame

uses java.io.BufferedReader
uses java.util.ArrayList
uses gw.util.p4.base.P4Factory
uses gw.util.p4.base.Path
uses gw.util.p4.base.FileLog
uses gw.util.p4.base.Diff2
uses gw.util.p4.base.PathRange
uses gw.util.p4.base.P4Client
uses java.util.Arrays

class P4Blame
{
  var _p4 : P4Client
  var _logBacktracks : boolean as LogBacktracks = false

  construct() {
    this(P4Factory.createP4())
  }

  construct(p4 : P4Client) {
    _p4 = p4
  }

  function forPath(pathStr : String) : RecordList {
    var start = new java.util.Date().Time
    try {    
      pathStr = _p4.fstat(pathStr)["depotFile"]
    }
    catch (t : java.lang.Throwable) {
      throw "No such file: ${pathStr}"
    }
    var path = P4Factory.createPath(pathStr)
    var recordList = new RecordList(path.toString(), _p4.print(path).map( \ line -> new Record(line) ))
    backtrackWithinPath(recordList, path, 0)
 
    print("time elapsed: " + ((new java.util.Date().Time - start) / 1000) + " seconds")

    return recordList
  }

  private function indent(n : int) : String {
    var bytes = new byte[n << 3]
    Arrays.fill(bytes, 32 as byte)
    return new String(bytes)
  }

  private function backtrackWithinPath(recordList : RecordList, pathrev : Path, recursionDepth : int) {
    if (LogBacktracks) {
      print("${indent(recursionDepth)}backtracking into: ${pathrev}")
    }
    var workingList = recordList.dup()
    var filelog = _p4.filelog(pathrev)

    for (logEntry in filelog index i) {
      if (recordList.isComplete()) {
        break
      }
      if (LogBacktracks) {
        print("${indent(recursionDepth)}  " + logEntry.PathRev)
      }

      workingList.resetAllFlags()
      var origWorkingList = workingList.dup()

      if (i < filelog.Count - 1) {
        backtrackRevWithinPath(workingList, logEntry, filelog[i + 1])
      }
      else {
        workingList.flagAllLinesAsPotentiallyFromInteg()
      }

      for (source in logEntry.Sources) {
        backtrackIntoIntegSource(origWorkingList.dup(), source, logEntry, recursionDepth)
      }

      if (recordList.foundBaseRevision(logEntry)) {
        recordList.setAllPendingRecords(logEntry)
        break
      }
    }
  }

  private function backtrackRevWithinPath(workingList : RecordList, logEntry : FileLog.Entry, logEntryPrev : FileLog.Entry) {
    for (diffEntry in _p4.diff2(logEntry.PathRev, logEntryPrev.PathRev)) {
      // simulate the change (backwards)
      var removedRecs = backtrack(workingList, diffEntry)
      for (removedRec in removedRecs) {
        removedRec.foundSourceRev(logEntry)
        removedRec.FlaggedForInterest = true
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
        forkedList[i] = null
      }
    }

    for (diffEntry in _p4.diff2(logEntry.PathRev, sourcePathRev)) {
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

  static function prompt() : String {
    return new BufferedReader(new java.io.InputStreamReader(java.lang.System.in, "UTF-8")).readLine()
  }
}
