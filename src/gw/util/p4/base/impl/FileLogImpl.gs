package gw.util.p4.base.impl
uses gw.util.p4.base.FileLog
uses gw.util.p4.base.PathRange
uses gw.util.p4.base.Path
uses java.util.regex.Pattern
uses gw.util.p4.base.PathRev
uses gw.util.p4.base.P4Factory

class FileLogImpl extends AbstractOperation implements FileLog {

  static var ENTRY_PAT = Pattern.compile("\\.\\.\\. #(\\d+) change (\\d+) (\\w+) on ([\\d/]+) by (\\w+).*")
  static var DETAIL_PAT = Pattern.compile("\\.\\.\\. \\.\\.\\. (\\w+)( (\\w+))? (([^#]+)#(\\d+)(,#(\\d+))?)")

  var _path : Path
  var _maxRevs : int
  var _list : List<EntryImpl>

  protected construct(client : P4ClientImpl) {
    super(client)
  }

  override function on(p : Path) : List<EntryImpl> {
    return on(p, 0)
  }

  override function on(p : Path, maxRevs : int) : List<EntryImpl> {
    if (p typeis PathRange) {
      throw "cannot do filelog operation on a path range"
    }
    _path = p
    _maxRevs = maxRevs
    _list = {}
    run()
    return _list
  }

  override function getCommand() : String {
    var maxRevsArg = _maxRevs > 0 ? "-m ${_maxRevs} " : ""
    return "filelog ${maxRevsArg}\"${_path.toString()}\""
  }

  override function handleLine(line : String) {
    var entryMatcher = ENTRY_PAT.matcher(line)
    if (entryMatcher.matches()) {
      var entry = new EntryImpl() {
        :PathRev = P4Factory.createPath("${_path.Path}#${entryMatcher.group(1) as int}") as PathRev,
        :Change = entryMatcher.group(2) as int,
        :Op = entryMatcher.group(3),
        :Date = entryMatcher.group(4),
        :User = entryMatcher.group(5)
      }
      _list.add(entry)
    }
    else {
      var detailMatcher = DETAIL_PAT.matcher(line)
      if (detailMatcher.matches()) {
        var detail = new EntryImpl.DetailImpl() {
          :SubOp = detailMatcher.group(1),
          :Direction = detailMatcher.group(3),
          :PathRev = P4Factory.createPath(detailMatcher.group(4)) as PathRev
        }

        if (detail.Direction == "from") {
          _list.last().Sources.add(detail)
        }
        else if (detail.Direction == "into") {
          _list.last().Targets.add(detail)
        }
        else {
          if (Verbose) {
            print("ignoring file log entry detail line: \"${line}\"")
          }
        }
      }
      else if (!line.startsWith("//depot/")) {
        throw "unrecognized line while parsing file log: ${line}"
      }
    }
  }

  static class EntryImpl implements FileLog.Entry {

    var _pathRev : PathRev as PathRev
    var _change : int as Change
    var _op : String as Op
    var _date : String as Date
    var _user : String as User
    var _sources : List<FileLog.Entry.Detail> as Sources
    var _targets : List<FileLog.Entry.Detail> as Targets

    construct() {
      Sources = {}
      Targets = {}
    }

    override function toString() : String {
      return "#${PathRev.Rev} change ${Change} ${Op} on ${Date} by ${User}"
    }

    static class DetailImpl implements FileLog.Entry.Detail {
      var _subOp : String as SubOp
      var _direction : String as Direction
      var _pathRev : PathRev as PathRev
      
      override function toString() : String {
        return "${SubOp} ${Direction} ${PathRev}"
      }
    }
  }

}
