package com.github.bchang.p4.blame

class ConsoleBlame implements IP4BlameListener {

  var _blame : IP4Blame
  var _lines : IP4BlameLine[]

  construct(blame : IP4Blame) {
    _blame = blame
    _blame.addListener(this)
  }

  function start(path : String) {
    _lines = _blame.forPathNoStart(path)
    _blame.start()
  }

  override function status(status : String) {
  }

  override function lineDiscovered(line : IP4BlameLine) {
  }
}
