package com.github.bchang.p4.base
uses com.github.bchang.p4.base.impl.P4ClientImpl
uses java.util.regex.Pattern

class P4Factory {

  static var PATH_PAT = Pattern.compile("([^#]+)(#(\\d+)(,#(\\d+))?)?")

  static function createP4() : P4Client {
    return createP4(null, null, null, null)
  }

  static function createP4(host : String, port : int, client : String, user : String) : P4Client {
    return createP4(host, port, client, user, false)
  }

  static function createP4(host : String, port : int, client : String, user : String, verbose : boolean) : P4Client {
    return createP4(host, port, client, user, verbose, false)
  }

  static function createP4(host : String, port : int, client : String, user : String, verbose : boolean, recordStats : boolean) : P4Client {
    return new P4ClientImpl(host, port, client, user, verbose, recordStats)
  }

  static function createPath(s : String) : Path {
    var pathMatcher = PATH_PAT.matcher(s)
    if (pathMatcher.matches()) {
      var path = pathMatcher.group(1)
      var rev = pathMatcher.group(3)
      var endRev = pathMatcher.group(5)
      if (endRev != null) {
        return createPath(path, rev as int, endRev as int)
      }
      else if (rev != null) {
        return createPath(path, rev as int)
      }
      else {
        return new Path(path)
      }
    }
    else {
      throw "could not parse path from \"${s}\""
    }
  }

  static function createPath(s : String, rev : int) : PathRev {
    return new PathRev(s, rev)
  }

  static function createPath(s : String, rev : int, endRev : int) : PathRange {
    return new PathRange(s, rev, endRev)
  }

  static function createPathChange(s : String, change : int) : PathChange {
    return new PathChange(s, change)
  }
}
