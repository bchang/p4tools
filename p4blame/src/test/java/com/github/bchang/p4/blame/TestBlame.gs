package com.github.bchang.p4.blame

uses java.lang.Integer
uses java.util.ArrayList
uses com.github.bchang.p4.base.P4Blame.ChangeInfo
uses com.github.bchang.p4.base.P4Blame.Line
uses com.github.bchang.p4.base.P4Blame.Listener

class TestBlame implements Listener {

  var _blame : P4Blame
  var _lines : List<Line>
  var _discoveries : ArrayList<Integer> as DiscoverySequenceByIndex = new ArrayList<Integer>()
  var _results : ChangeInfo[] as Results

  construct(blame : P4Blame) {
    _blame = blame
    _blame.addListener(this)
  }

  function setup(path : String) : List<Line> {
    _lines = _blame.setup(path)
    _results = new ChangeInfo[_lines.Count]
    return _lines
  }

  function start() {
    _blame.start()
  }

  override function status(status : String) {
  }

  override function lineDiscovered(lineNum : int, info : ChangeInfo) {
    _discoveries.add(lineNum)
    _results[lineNum] = info
  }
}
