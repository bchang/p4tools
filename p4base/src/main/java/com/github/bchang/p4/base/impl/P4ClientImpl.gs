package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.P4Client
uses com.github.bchang.p4.base.FileLog
uses com.github.bchang.p4.base.P4Factory
uses com.github.bchang.p4.base.Diff2
uses java.util.Map
uses com.github.bchang.p4.base.Path
uses gw.util.Shell
uses java.lang.StringBuilder
uses gw.util.ProcessStarter
uses java.util.HashSet
uses java.util.Set
uses com.github.bchang.p4.base.IP4ChangeInfo
uses gw.lang.reflect.ReflectUtil

class P4ClientImpl implements P4Client {

  var _host : String as Host
  var _port : int as Port
  var _client : String as Client
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

  override function add(paths : Path[]) {
    new FileOperation(this, "add", paths).run()
  }

  override function edit(paths : Path[]){
    new FileOperation(this, "edit", paths).run()
  }

  override function delete(paths : Path[]){
    new FileOperation(this, "delete", paths).run()
  }

  override function revert(paths : Path[]){
    new FileOperation(this, "revert", paths).run()
  }

  override function diff2(left : Path, right : Path) : List<Diff2.Entry> {
    var diff2 = new Diff2Impl(this)
    if (_stats != null) {
      _stats.recordDiff2(left.toString() + " " + right.toString())
    }
    return diff2.run(left, right)
  }

  override function filelog(path : Path) : List<FileLog.Entry> {
    var filelog = new FileLogImpl(this)
    if (_stats != null) {
      _stats.recordFilelog(path.Path)
    }
    return filelog.run(path)
  }

  override function filelog(path : Path, maxRevs : int) : List<FileLog.Entry> {
    var filelog = new FileLogImpl(this)
    return filelog.run(path, maxRevs)
  }

  override function fstat(path : Path) : Map<String, String> {
    var fstat = new FstatImpl(this)
    return fstat.run(path)
  }

  override function print(path : Path) : List<String> {
    var printq = new PrintImpl(this)
    return printq.run(path)
  }

  override function blame(path : Path) : List<IP4ChangeInfo> {
    // TODO - fix nasty reflection
    var blame = ReflectUtil.construct("com.github.bchang.p4.blame", {this})
    return ReflectUtil.invokeMethod(blame, "blame", {path}) as List<IP4ChangeInfo>
  }

  protected function run(op : AbstractOperation) {
    p4process(op.getCommand())
         .withStdOutHandler(\ line -> op.handleLine(line))
         .withStdErrHandler(\ line -> op.handleLine(line))
         .exec()
  }

  override function run(op : String) : String {
    var out = new StringBuilder()
    p4process(op)
         .withStdOutHandler(\ line -> out.append(line).append("\n"))
         .exec()
    return out.toString()
  }

  override function runUntil(op : String, until : gw.util.Predicate<String>) : String {
    var foundLine : String
    p4process(op)
         .withStdOutHandler(\ line -> { if (foundLine == null && until.evaluate(line)) foundLine = line })
         .exec()
    return foundLine
  }

  override function exec(op : String) {
    p4process(op).exec()
  }

  override function exec(op : String, handler : ProcessStarter.OutputHandler) {
    p4process(op).withStdOutHandler(handler).exec()
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
