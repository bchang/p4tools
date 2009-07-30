package gw.util.p4

uses gw.util.AutoMap
uses gw.util.IntegerRange
uses gw.util.Shell
uses java.util.ArrayList
uses java.util.LinkedHashMap
uses java.util.Map
uses java.util.regex.Pattern
uses java.util.HashMap
uses java.lang.Integer

class P4Client
{
  var diff2Cache = new AutoMap<String, List<DiffEntry>>(\ cmd -> {
    var cacheDiff = new ArrayList<DiffEntry>()
    var pat = Pattern.compile("(\\d+(,\\d+)?)([acd])(\\d+(,\\d+)?)")
    for (line in p4(cmd)[0]) {
      var matcher = pat.matcher(line)
      if (matcher.matches()) {
        cacheDiff.add(new DiffEntry(matcher.group(3), parseRange(matcher.group(1)), parseRange(matcher.group(4))))
      }
    }
    return cacheDiff
  })

  var filelogCache = new HashMap<String, List<FileLogEntry>>()

  function printq(pathrev : PathRev) : List<String> {
    return p4("print -q \"${pathrev}\"")[0]
  }

  function fstat(arg : String) : Map<String, String> {
    var fstat = p4("fstat \"${arg}\"")
    if (fstat[0].Count > 0) {
      var map = new LinkedHashMap<String, String>()
      var pat = Pattern.compile("\\.\\.\\. (\\w+) (.*)")
      for (line in fstat[0]) {
        var matcher = pat.matcher(line)
        if (matcher.matches()) {
          map.put(matcher.group(1), matcher.group(2))
        }
      }
      return map
    }
    else {
      throw "File not in depot: ${Arg}"
    }
  }

  private function cacheFilelog(pathrev : PathRev) : List<FileLogEntry> {
    var list = new ArrayList<FileLogEntry>()
    
    var filelog = p4("filelog \"${pathrev}\"")
    var opPat = Pattern.compile("\\.\\.\\. #(\\d+) change (\\d+) (\\w+) on ([\\d/]+) by (\\w+).*")
    var subopPat = Pattern.compile("\\.\\.\\. \\.\\.\\. \\w+ (\\w+) ([^#]+)#(\\d+)(,#(\\d+))?")
    for (line in filelog[0]) {
      var opMatcher = opPat.matcher(line)
      var subopMatcher = subopPat.matcher(line)
      if (opMatcher.matches()) {
        var entry = new FileLogEntry()
        entry.PathRev = new PathRev(pathrev.Path, opMatcher.group(1) as int)
        entry.Change = opMatcher.group(2) as int
        entry.Op = opMatcher.group(3)
        entry.Date = opMatcher.group(4)
        entry.User = opMatcher.group(5)
        list.add(entry)
      }
      else if (subopMatcher.matches()) {
        var dir = subopMatcher.group(1)
        var otherPath = new PathRev(subopMatcher.group(2), subopMatcher.group(5) != null
                                                        ? subopMatcher.group(5) as int : subopMatcher.group(3) as int)
        if (dir == "from") {
          list.last().addSource(otherPath)
        }
        else if (dir == "into") {
          list.last().addTarget(otherPath)
        }
        else if (dir != "by") {
          throw "unrecognized direction: " + dir
        }
      }
    }
    filelogCache.put(pathrev.Path, list)
    return list
  }

  function filelog(pathrev : PathRev) : List<FileLogEntry> {
    var cachedFilelog = filelogCache.get(pathrev.Path)
    if (cachedFilelog == null or pathrev.Rev > cachedFilelog.Count) {
      cachedFilelog = cacheFilelog(pathrev)
    }

    if (pathrev.Rev == 0) {
      return cachedFilelog
    }
    else {
      // get a "sublist" beginning at cachedFilelog.length - pathrev.Rev
      var list = new ArrayList<FileLogEntry>()
      for(n in Integer.range(cachedFilelog.Count - pathrev.Rev, cachedFilelog.Count - 1)) {
        list.add(cachedFilelog[n])
      }
      return list
    }
  }

  function diff2(arg1 : PathRev, arg2 : PathRev) : List<DiffEntry> {
    return diff2Cache.get("diff2 \"${arg1}\" \"${arg2}\"")
  }

  function createPathRev(path : String) : PathRev {
    var matcher = Pattern.compile("([^#]*)#(\\d+)").matcher(path)
    if (matcher.matches()) {
      return new PathRev(matcher.group(1), matcher.group(2) as int)
    }
    else {
      return filelog(new PathRev(path)).first().PathRev
    }
  }

  private function p4(cmd : String) : List<List<String>> {
    var outList = new ArrayList<String>()
    var errList = new ArrayList<String>()
    Shell.buildProcess("p4 " + cmd)
         .withStdOutHandler( \ line -> outList.add(line) )
         .withStdErrHandler( \ line -> errList.add(line) )
         .exec()
    return new ArrayList<List<String>>() { outList, errList }
  }

  private static function parseRange(range : String) : IntegerRange {
    if (range.contains(",")) {
      var split = range.split(",")
      return new IntegerRange((split[0] as int) - 1, (split[1] as int) - 1)
    }
    else {
      return new IntegerRange((range as int) - 1, (range as int) - 1)
    }
  }

  class FileLogEntry
  {
    var _pathRev : PathRev as PathRev
    var _change : int as Change
    var _op : String as Op
    var _date : String as Date
    var _user : String as User
    var _sources : List<PathRev> as readonly Sources
    var _targets : List<PathRev> as readonly Targets

    construct() {
      _sources = {}
      _targets = {}
    }

    function addSource(pr : PathRev) {
      _sources.add(pr)
    }

    function addTarget(pr : PathRev) {
      _targets.add(pr)
    }

    override function toString() : String {
      return "${PathRev} ${Change} ${Op} ${User}"
    }
  }

  class DiffEntry {
    var _op : String as readonly Op
    var _leftLines : IntegerRange
    property get LeftLines() : IntegerRange { return _leftLines.copy() }
    var _rightLines : IntegerRange
    property get RightLines() : IntegerRange { return _rightLines.copy() }
 
    construct(s : String, ll : IntegerRange, rl : IntegerRange) {
      _op = s
      _leftLines = ll
      _rightLines = rl
    }
    
    override function toString() : String {
      return "${LeftLines.start},${LeftLines.end} ${Op} ${RightLines.start},${RightLines.end}"
    }
  }

  class PathRev
  {
    var _path : String as readonly Path
    var _rev : int as readonly Rev

    private construct(s : String) {
      _path = s
      _rev = 0
    }

    private construct(s : String, i : int) {
      _path = s
      _rev = i
    }

    override function toString() : String {
      return Rev == 0 ? Path : Path + "#" + Rev
    }

    override function equals(o : Object) : boolean {
      return toString() == o.toString()
    }

    override function hashCode() : int {
      return toString().hashCode()
    }
  }
}
