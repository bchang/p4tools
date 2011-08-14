package com.github.bchang.p4.blame

uses java.lang.Integer
uses java.util.ArrayList

class TestBlame implements IP4BlameListener {

  var _blame : IP4Blame
  var _lines : IP4BlameLine[]
  var _discoveries : ArrayList<Integer> as DiscoverySequenceByIndex = new ArrayList<Integer>()

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

  override function lineDiscovered(line : IP4BlameLine) {
    _discoveries.add(line.Id)
  }
}
