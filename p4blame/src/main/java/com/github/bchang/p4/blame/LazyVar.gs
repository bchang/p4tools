package com.github.bchang.p4.blame

/**
 */
class LazyVar {

  static function make(init() : String) : LazyVar {
    return new LazyVar(init)
  }

  var _val : String
  var _init : block() : String

  private construct(init() : String) {
    _init = init
  }

  function get() : String {
    if (_val == null) {
      _val = _init()
    }
    return _val
  }
}
