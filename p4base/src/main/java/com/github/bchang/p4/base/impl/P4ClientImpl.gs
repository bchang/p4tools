package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.P4Client
uses com.github.bchang.p4.base.FileLog
uses com.github.bchang.p4.base.P4Factory
uses com.github.bchang.p4.base.Diff2
uses java.util.Map
uses com.github.bchang.p4.base.Path
uses java.lang.StringBuilder
uses java.io.InputStreamReader
uses java.util.ArrayList
uses java.util.List
uses java.util.HashMap
uses java.util.HashSet
uses java.util.Map
uses java.util.Set
uses com.github.bchang.p4.base.P4Blame
uses com.github.bchang.p4.base.P4Blame.Line
uses gw.lang.reflect.ReflectUtil
uses java.lang.ProcessBuilder
uses java.io.BufferedReader
uses java.lang.Process
uses com.github.bchang.p4.base.P4UnmarshalledObject
uses java.io.BufferedWriter
uses java.io.OutputStreamWriter
uses java.nio.ByteBuffer
uses java.nio.ByteOrder

class P4ClientImpl implements P4Client {

  var _host : String as Host
  var _port : int as Port
  var _client : String as Client
  var _user : String as User
  var _verbose : boolean as Verbose
  var _stats : Stats as Stats
  var _stderrPump : StdErrPump

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
    _stderrPump = new()
    _stderrPump.start()
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

  override function blame() : P4Blame {
    return ReflectUtil.construct("com.github.bchang.p4.blame.P4Blame", {this})
  }

  private function readInputStreamIntoByteArray(is : java.io.InputStream) : byte[] {
    var list = new ArrayList<java.lang.Byte>()
    var bb = new byte[8]
    using (var input = is) {
      while (true) {
        var numRead = input.read(bb)
        if (numRead < 0) {
          break
        }
        var i = 0
        while (i < numRead) {
          list.add(bb[i])
          i++
        }
      }
    }
    var bytes = new byte[list.Count]
    for (b in list index i) {
      bytes[i] = b
    }
    return bytes
  }

  private function writeToFile(bytes : byte[], file : java.io.File) {
    var bais = new java.io.ByteArrayInputStream(bytes)
    using (var out = new java.io.FileOutputStream(file)) {
      gw.util.StreamUtil.copy(bais, out)
    }
  }

  override function runForObjects(op : List<String>) : List<P4UnmarshalledObject> {
    op.add(0, "-G")

    var p4objs = new ArrayList<P4UnmarshalledObject>()
    var p4obj = new P4UnmarshalledObject()
    var process = p4process(op)
    var bytes = readInputStreamIntoByteArray(process.InputStream)
    var bais = new java.io.ByteArrayInputStream(bytes)
    using (var input = bais) {
      var b = input.read() // gobble leading 0x7B
      var idx = 0
      while (true) {
        b = input.read() // gobble 's'
        idx++
        if (b == -1 || b == 0x0A) {
          break
        }
        if (b == 0x30) {
          p4objs.add(p4obj)
          p4obj = null
          input.read() // gobble leading 0x7B
          continue
        }
        else if (p4obj == null) {
          p4obj = new P4UnmarshalledObject()
        }

        if (b != 0x73) {
          writeToFile(bytes, new java.io.File("/tmp/badOutput"))
          throw "oopsie at ${idx} - expected ${0x73}, got ${b} - wrote to /tmp/badOutput"
        }

        var word = new byte[4]
        input.read(word)
        var size = decodeFromByteArray(word)

        var keyBytes = new byte[size]
        input.read(keyBytes)
        var key = new String(keyBytes, "UTF-8")

        b = input.read() // gobble 's'
        if (b == 0x73) {
          input.read(word)
          size = decodeFromByteArray(word)

          var valBytes = new byte[size]
          input.read(valBytes)
          var val = new String(valBytes, "UTF-8")

          p4obj.addDictEntry(key, val)
        }
        else if (b == 0x69) {
          input.read(word)
          p4obj.addCode(key, decodeFromByteArray(word))
        }
      }
    }
    process.waitFor()
    return p4objs
  }

  private function decodeFromByteArray(word: byte[]) : int {
    return ByteBuffer.wrap(word).order(ByteOrder.LITTLE_ENDIAN).Int
  }

  override function runForRawOutput(op : List<String>) : List<String> {
    var output = new ArrayList<String>()
    var process = p4process(op)
    using (var reader = new BufferedReader(new InputStreamReader(process.InputStream, "UTF-8"))) {
      while (true) {
        var line = reader.readLine()
        if (line == null) {
          break
        }
        output.add(line)
      }
    }
    process.waitFor()
    return output
  }

  override function run(op : List<String>) : String {
    return run(op, null)
  }

  override function run(op : List<String>, input : String) : String {
    var output = new StringBuilder()
    var process = p4process(op)
    if (input != null) {
      using (var writer = new BufferedWriter(new OutputStreamWriter(process.OutputStream, "UTF-8"))) {
        writer.write(input)
      }
    }
    using (var reader = new BufferedReader(new InputStreamReader(process.InputStream, "UTF-8"))) {
      while (true) {
        var line = reader.readLine()
        if (line == null) {
          break
        }
        output.append(line).append("\n")
      }
    }
    process.waitFor()
    return output.toString().trim()
  }

  private function p4process(cmd: List<String>) : Process {
    cmd.add(0, "p4")
    if (_verbose) {
      print("> " + cmd.join(" "))
    }

    var builder = new ProcessBuilder(cmd)
    if (_host != null) {
      builder.environment()["P4HOST"] = _host
    }
    if (_port != null && _port != 0) {
      builder.environment()["P4PORT"] = (_host == null ? "localhost" : _host) + ":" + _port
    }
    if (_client != null) {
      builder.environment()["P4CLIENT"] = _client
    }
    if (_user != null) {
      builder.environment()["P4USER"] = _user
    }
    var process = builder.start()
    _stderrPump.attachErrorStream(process.ErrorStream)
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
