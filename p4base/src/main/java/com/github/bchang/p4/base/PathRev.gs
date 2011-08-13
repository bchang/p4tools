package com.github.bchang.p4.base

class PathRev extends Path {

  var _rev : int as readonly Rev

  protected construct(s : String, i : int) {
    super(s)
    _rev = i
  }

  override function toString() : String {
    return Path + "#" + Rev
  }
}
