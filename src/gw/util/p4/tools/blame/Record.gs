package gw.util.p4.tools.blame

uses gw.util.p4.base.FileLog

class Record
{
  var _fileLogEntry : FileLog.Entry as readonly LogEntry
  var _line : String as readonly Line
  var _flag : boolean as FlaggedForInterest

  construct(lineArg : String) {
    _line = lineArg
  }

  function foundSourceRev(entry : FileLog.Entry) {
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
