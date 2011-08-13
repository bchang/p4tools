package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.FileLog
uses java.lang.Integer

class Record implements IP4BlameLine
{
  var _fileLogEntry : FileLog.Entry as readonly LogEntry
  var _line : String as readonly Line
  var _flag : boolean as FlaggedForInterest
  var _origIdx : Integer as OrigIdx

  property get Change() : int {
    return LogEntry.Change
  }

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
