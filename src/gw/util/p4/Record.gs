package gw.util.p4

class Record
{
  var _fileLogEntry : P4Client.FileLogEntry as readonly LogEntry
  var _line : String as readonly Line
  var _flag : boolean as FlaggedForInterest

  construct(lineArg : String) {
    _line = lineArg
  }

  function foundSourceRev(entry : P4Client.FileLogEntry) {
    _fileLogEntry = entry
  }

  function resetSourceRev() {
    _fileLogEntry = null
  }

  function hasFoundSourceRev() : boolean {
    return LogEntry != null
  }

  override function toString() : String {
    return _line
  }
}
