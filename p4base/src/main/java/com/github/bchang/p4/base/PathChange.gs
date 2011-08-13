package com.github.bchang.p4.base

class PathChange extends Path {

  var _change : int as readonly Change

  protected construct(s : String, i : int) {
    super(s)
    _change = i
  }

  override function toString() : String {
    return Change > 0 ? Path + "@" + Change : Path
  }
}
