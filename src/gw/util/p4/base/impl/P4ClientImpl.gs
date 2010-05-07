package gw.util.p4.base.impl
uses gw.util.p4.base.P4Client
uses gw.util.p4.base.FileLog
uses gw.util.p4.base.P4Factory
uses gw.util.p4.base.Diff2
uses java.util.Map
uses gw.util.p4.base.Path
uses gw.util.Shell
uses java.lang.StringBuilder
uses gw.util.ProcessStarter
uses java.util.HashSet
uses java.util.Set

class P4ClientImpl implements P4Client {

  var _host : String as readonly Host
  var _port : int
  var _client : String as readonly Client
  var _user : String as User
  var _verbose : boolean as Verbose
  var _stats : Stats as Stats

  construct(hostname : String, port : int, clientname : String, username : String, isVerbose : boolean) {
    this(hostname, port, clientname, username, isVerbose, false)
  }

  construct(hostname : String, port : int, clientname : String, username : String, isVerbose : boolean, recordStats : boolean) {
    _host = hostname
    _port = port
    _client = clientname
    _user = username
    _verbose = isVerbose
    if (recordStats) {
      _stats = new Stats()
    }
  }

  override function clearStats() {
    if (_stats != null) {
      _stats.clear()
    }
    else {
      throw "not recording stats"
    }
  }

  override function printStats() {
    if (_stats != null) {
      _stats.print()
    }
    else {
      throw "not recording stats"
    }
  }

  override function diff2(left : String, right : String) : List<Diff2.Entry> {
    return diff2(P4Factory.createPath(left), P4Factory.createPath(right))
  }

  override function diff2(left : Path, right : Path) : List<Diff2.Entry> {
    var diff2 = new Diff2Impl(this)
    if (_stats != null) {
      _stats.recordDiff2(left.toString() + " " + right.toString())
    }
    return diff2.on(left, right)
  }

  override function filelog(path : String) : List<FileLog.Entry> {
    return filelog(P4Factory.createPath(path))
  }

  override function filelog(path : Path) : List<FileLog.Entry> {
    var filelog = new FileLogImpl(this)
    if (_stats != null) {
      _stats.recordFilelog(path.Path)
    }
    return filelog.on(path)
  }

  override function filelog(path : String, maxRevs : int) : List<FileLog.Entry> {
    return filelog(P4Factory.createPath(path), maxRevs)
  }

  override function filelog(path : Path, maxRevs : int) : List<FileLog.Entry> {
    var filelog = new FileLogImpl(this)
    return filelog.on(path, maxRevs)
  }

  override function fstat(path : String) : Map<String, String> {
    return fstat(P4Factory.createPath(path))
  }

  override function fstat(path : Path) : Map<String, String> {
    var fstat = new FstatImpl(this)
    return fstat.on(path)
  }

  override function print(path : String) : List<String> {
    return this.print(P4Factory.createPath(path))
  }

  override function print(path : Path) : List<String> {
    var printq = new PrintImpl(this)
    return printq.on(path)
  }

  protected function run(op : AbstractOperation) {
    p4process(op.getCommand())
         .withStdOutHandler(\ line -> op.handleLine(line))
         .withStdErrHandler(\ line -> op.handleLine(line))
         .exec()
  }

  override function run(op : String) : String {
    var out = new StringBuilder()
    var err = new StringBuilder()
    p4process(op)
         .withStdOutHandler(\ line -> out.append(line).append("\n"))
         .withStdErrHandler(\ line -> err.append(line).append("\n"))
         .exec()
    if (err.length() > 0) {
      print("got stderr output:")
      print(err)
    }
    return out.toString()
  }

  override function run(op : String, handler : ProcessStarter.ProcessHandler) {
    p4process(op).processWithHandler(handler)
  }

  private function p4process(op : String) : ProcessStarter {
    var cmd = "p4 ${op}"
    if (_verbose) {
      print("> ${cmd}")
    }
    var process = Shell.buildProcess(cmd)
    if (_host != null) {
      process.Environment["P4HOST"] = _host
    }
    if (_port != null && _port != 0) {
      process.Environment["P4PORT"] = _port as String
    }
    if (_client != null) {
      process.Environment["P4CLIENT"] = _client
    }
    if (_user != null) {
      process.Environment["P4USER"] = _user
    }
    return process
  }

  class Stats {
    var _diff2CallCount : int as Diff2CallCount
    var _diff2CallLog : Set<String> as Diff2CallLog
    var _filelogCallCount : int as FilelogCallCount
    var _filelogCallLog : Set<String> as FilelogCallLog

    construct() {
      clear()
    }

    final function clear() {
      _diff2CallCount = 0
      _diff2CallLog = new HashSet<String>()
      _filelogCallCount = 0
      _filelogCallLog = new HashSet<String>()
    }

    function print() {
      print("# diff2 calls: ${_diff2CallCount}")
      print("# unique diff2 calls: ${_diff2CallLog.Count}")
      print("# filelog calls: ${_filelogCallCount}")
      print("# unique filelog calls: ${_filelogCallLog.Count}")
    }

    function recordDiff2(str : String) {
      _diff2CallCount++
      _diff2CallLog.add(str)
    }

    function recordFilelog(str : String) {
      _filelogCallCount++
      _filelogCallLog.add(str)
    }
  }
}
