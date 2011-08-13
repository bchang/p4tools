package com.github.bchang.p4.base
uses gw.util.IntegerRange
uses java.util.List

interface Diff2 {

  function on(left : Path, right : Path) : List<Entry>

  static interface Entry {
    property get Op() : String
    property get LeftRange() : IntegerRange
    property get RightRange() : IntegerRange
    property get LeftLines() : List<String>
    property get RightLines() : List<String>
  }

}
