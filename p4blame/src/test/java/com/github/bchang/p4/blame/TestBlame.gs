package com.github.bchang.p4.blame

uses java.lang.Integer
uses java.util.ArrayList

class TestBlame implements IP4BlameListener {

  var _blame : IP4Blame
  var _lines : String[]
  var _discoveries : ArrayList<Integer> as DiscoverySequenceByIndex = new ArrayList<Integer>()
  var _results : IP4BlameLine[] as Results

  construct(blame : IP4Blame) {
    _blame = blame
    _blame.addListener(this)
  }

  function setup(path : String) : String[] {
    _lines = _blame.setup(path)
    _results = new IP4BlameLine[_lines.Count]
    return _lines
  }

  function start() {
    _blame.start()
  }

  override function status(status : String) {
  }

  override function lineDiscovered(line : IP4BlameLine) {
    _discoveries.add(line.Id)
    _results[line.Id] = line
  }
}
