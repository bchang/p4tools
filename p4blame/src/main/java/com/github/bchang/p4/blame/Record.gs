package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.P4Blame.Line
uses com.github.bchang.p4.base.P4Blame.ChangeInfo
uses java.lang.Integer

class Record implements Line
{
  var _changeInfo : ChangeInfo as readonly ChangeInfo
  var _line : String as readonly Content
  var _id : Integer as readonly Id

  construct(lineArg : String, i : int) {
    _line = lineArg
    _id = i
  }

  function discovered(change : ChangeInfo) {
    _changeInfo = change
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
