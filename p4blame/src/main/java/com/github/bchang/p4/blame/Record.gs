package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.IP4BlameLine
uses com.github.bchang.p4.base.IP4ChangeInfo
uses java.lang.Integer

class Record implements IP4BlameLine
{
  var _changeInfo : IP4ChangeInfo as readonly ChangeInfo
  var _line : String as readonly Line
  var _id : Integer as readonly Id

  construct(lineArg : String, i : int) {
    _line = lineArg
    _id = i
  }

  function discovered(change : IP4ChangeInfo) {
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
