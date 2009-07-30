package gw.util.p4.base

class Path {

  var _path : String as readonly Path

  protected construct(s : String) {
    _path = s
  }

  override function toString() : String {
    return Path
  }

  override function equals(o : Object) : boolean {
    return toString() == o.toString()
  }

  override function hashCode() : int {
    return toString().hashCode()
  }
}
