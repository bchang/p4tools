package com.github.bchang.p4.base

uses gw.lang.reflect.interval.IntegerInterval

interface Diff2 {

  function on(left : Path, right : Path) : List<Entry>

  static interface Entry {
    property get Op() : String
    property get LeftRange() : IntegerInterval
    property get RightRange() : IntegerInterval
    property get LeftLines() : List<String>
    property get RightLines() : List<String>
  }

}
