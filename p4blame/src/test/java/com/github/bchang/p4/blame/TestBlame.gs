package com.github.bchang.p4.blame

class TestBlame implements IP4BlameListener {

  var _blame : IP4Blame
  var _lines : IP4BlameLine[]

  construct(blame : IP4Blame) {
    _blame = blame
    _blame.addListener(this)
  }

  function forPathNoStart(path : String) : IP4BlameLine[] {
    _lines = _blame.forPathNoStart(path)
    return _lines
  }

  function start() {
    _blame.start()
  }

  override function lineDiscovered(idx : int, line : IP4BlameLine) {
    print("discovered ${idx}")
  }

  override function blameDone() {
  }
}
