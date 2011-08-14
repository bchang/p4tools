package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.FileLog
uses java.lang.Integer

class Record implements IP4BlameLine
{
  var _fileLogEntry : FileLog.Entry as readonly LogEntry
  var _line : String as readonly Line
  var _id : Integer as Id

  property get Change() : int {
    return LogEntry.Change
  }

  construct(lineArg : String, i : int) {
    _line = lineArg
    _id = i
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

  override function hashCode() : int {
    return _id.hashCode()
  }

  override function equals(o : Object) : boolean {
    return _id.equals((o as Record).Id)
  }
}
