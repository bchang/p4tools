package gw.util.p4.base.impl
uses gw.util.IntegerRange
uses gw.util.p4.base.Diff2
uses gw.util.p4.base.Path
uses gw.util.p4.base.PathRange
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

  private static function parseRange(range : String) : IntegerRange {
    if (range.contains(",")) {
      var split = range.split(",")
      return new IntegerRange((split[0] as int), (split[1] as int))
    }
    else {
      return new IntegerRange((range as int), (range as int))
    }
  }

  static class EntryImpl implements Diff2.Entry {
    var _op : String as readonly Op
    var _leftRange : IntegerRange
    var _rightRange : IntegerRange
    var _leftLines : List<String> as LeftLines = new ArrayList<String>()
    var _rightLines : List<String> as RightLines = new ArrayList<String>()
    override property get LeftRange() : IntegerRange { return _leftRange.copy() }
    override property get RightRange() : IntegerRange { return _rightRange.copy() }
 
    protected construct(s : String, lr : IntegerRange, rr : IntegerRange) {
      _op = s
      _leftRange = lr
      _rightRange = rr
    }
    
    override function toString() : String {
      return "${LeftRange.start},${LeftRange.end} ${Op} ${RightRange.start},${RightRange.end}"
    }
  }
}