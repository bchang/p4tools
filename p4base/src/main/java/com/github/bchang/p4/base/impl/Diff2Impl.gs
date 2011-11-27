package com.github.bchang.p4.base.impl

uses gw.lang.reflect.interval.IntegerInterval
uses com.github.bchang.p4.base.Diff2
uses com.github.bchang.p4.base.Path
uses com.github.bchang.p4.base.PathRange
uses java.util.regex.Pattern
uses java.util.ArrayList
uses java.util.List

class Diff2Impl extends AbstractOperation implements Diff2 {

  static var CODE_PAT = Pattern.compile("(\\d+(,\\d+)?)([acd])(\\d+(,\\d+)?)")
  static var LINE_PAT = Pattern.compile("([<>]) (.*)")

  var _left : Path
  var _right : Path
  var _list : List<EntryImpl>

  protected construct(client : P4ClientImpl) {
    super(client)
  }

  override function on( left : Path, right : Path ) : List<EntryImpl> {
    if (left typeis PathRange or right typeis PathRange) {
      throw "cannot do diff operation on a path range"
    }
    _left = left
    _right = right
    _list = {}
    run()
    return _list
  }

  override function getCommand() : String {
    return "diff2 \"${_left.toString()}\" \"${_right.toString()}\""
  }

  override function handleLine( line : String ) {
    var matcher = CODE_PAT.matcher(line)
    if (matcher.matches()) {
      _list.add(new EntryImpl(matcher.group(3), parseRange(matcher.group(1)), parseRange(matcher.group(4))))
    }
    else {
      matcher = LINE_PAT.matcher(line)
      if (matcher.matches()) {
        if (matcher.group(1) == "<") {
          _list.last().LeftLines.add(matcher.group(2))
        }
        else {
          _list.last().RightLines.add(matcher.group(2))
        }
      }
    }
  }

  private static function parseRange(range : String) : IntegerInterval {
    if (range.contains(",")) {
      var split = range.split(",")
      return new IntegerInterval((split[0].toInt()), (split[1].toInt()))
    }
    else {
      return new IntegerInterval(range.toInt(), range.toInt())
    }
  }

  static class EntryImpl implements Diff2.Entry {
    var _op : String as readonly Op
    var _leftRange : IntegerInterval
    var _rightRange : IntegerInterval
    var _leftLines : List<String> as LeftLines = new ArrayList<String>()
    var _rightLines : List<String> as RightLines = new ArrayList<String>()
    override property get LeftRange() : IntegerInterval { return _leftRange.copy() }
    override property get RightRange() : IntegerInterval { return _rightRange.copy() }
 
    protected construct(s : String, lr : IntegerInterval, rr : IntegerInterval) {
      _op = s
      _leftRange = lr
      _rightRange = rr
    }
    
    override function toString() : String {
      return "${LeftRange.first()},${LeftRange.last()} ${Op} ${RightRange.first()},${RightRange.last()}"
    }
  }
}
