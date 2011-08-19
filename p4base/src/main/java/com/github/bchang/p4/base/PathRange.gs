package com.github.bchang.p4.base

class PathRange extends PathRev {

  var _endRev : int as readonly EndRev

  protected construct(s : String, i : int, j : int) {
    super(s, i)
    _endRev = j
  }

  override function toString() : String {
    return Path + "#" + Rev + ",#" + EndRev
  }

  override property get EndPathRev() : PathRev {
    return P4Factory.createPath(Path, EndRev)
  }
}
