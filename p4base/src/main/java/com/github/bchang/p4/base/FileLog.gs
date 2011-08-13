package com.github.bchang.p4.base
uses java.util.List

interface FileLog {

  function on(path : Path) : List<Entry>

  function on(path : Path, maxRevs : int) : List<Entry>

  static interface Entry {

    property get PathRev() : PathRev
    property get Change() : int
    property get Op() : String
    property get Date() : String
    property get User() : String
    property get Sources() : List<Detail>
    property get Targets() : List<Detail>

    static interface Detail {
      property get SubOp() : String
      property get Direction() : String
      property get PathRev() : PathRev
    }
  }
}
