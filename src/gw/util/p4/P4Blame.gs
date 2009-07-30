package gw.util.p4

uses java.io.BufferedReader
uses java.io.File
uses java.util.ArrayList

class P4Blame
{
  var _p4 = new P4Client()

  construct() {
  }


  function forPath(path : String) : RecordList {
    var start = new java.util.Date().Time
    try {    
      path = _p4.fstat(path)["depotFile"]
    }
    catch (t : java.lang.Throwable) {
      throw "No such file: ${path}"
    }
    var pathrev = _p4.createPathRev(path)
    var recordList = new RecordList(pathrev as String, _p4.printq(pathrev).map( \ line -> new Record(line) ))
    backtrackWithinPath(recordList, pathrev)
 
    print("time elapsed: " + ((new java.util.Date().Time - start) / 1000) + " seconds")

    return recordList
  }

  private function backtrackWithinPath(recordList : RecordList, pathrev : P4Client.PathRev) {
    var workingList = recordList.dup()
    var filelog = _p4.filelog(pathrev)

    for (logEntry in filelog index i) {
      if (recordList.isComplete()) {
        break
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
        backtrackIntoIntegSource(origWorkingList.dup(), source, logEntry)
      }

      if (recordList.foundBaseRevision(logEntry)) {
        recordList.setAllPendingRecords(logEntry)
        break
      }
    }
  }

  private function backtrackRevWithinPath(workingList : RecordList, logEntry : P4Client.FileLogEntry, logEntryPrev : P4Client.FileLogEntry) {
    for (diffEntry in _p4.diff2(logEntry.PathRev, logEntryPrev.PathRev)) {
      // simulate the change (backwards)
      var removedRecs = backtrack(workingList, diffEntry)
      for (removedRec in removedRecs) {
        removedRec.foundSourceRev(logEntry)
        removedRec.FlaggedForInterest = true
      }
    }
  }

  function backtrackIntoIntegSource(recordList : RecordList, sourcePathRev : P4Client.PathRev, logEntry : P4Client.FileLogEntry) {
    var forkedList = recordList.dup()

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
    backtrackWithinPath( forkedList, sourcePathRev )
  }

  private function backtrack(records : RecordList, diffEntry : P4Client.DiffEntry) : List<Record> {
    var removedRecs = new ArrayList<Record>()
    if (diffEntry.Op == "c" or diffEntry.Op == "d") {
      for (n in diffEntry.LeftLines) {
        var indexToRemove = (diffEntry.Op == "d") ? diffEntry.RightLines.start + 1 : diffEntry.RightLines.start
        var removedRec = records.remove(indexToRemove)
        if (removedRec != null) removedRecs.add(removedRec)
      }
    }
    if (diffEntry.Op == "c" or diffEntry.Op == "a") {
      for (n in diffEntry.RightLines) {
        records.add(n, null)
      }
    }
    return removedRecs
  }

  static function prompt() : String {
    return new BufferedReader(new java.io.InputStreamReader(java.lang.System.in, "UTF-8")).readLine()
  }
}
