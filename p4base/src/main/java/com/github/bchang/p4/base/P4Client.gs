package com.github.bchang.p4.base
uses java.util.Map
uses gw.util.ProcessStarter

interface P4Client {

  abstract property get Host() : String
  abstract property get Client() : String
  abstract property get User() : String
  abstract property set User(s : String)

  function clearStats()
  function printStats()

  function diff2(left : Path, right : Path) : List<Diff2.Entry>
  function diff2(left : String, right : String) : List<Diff2.Entry>

  function filelog(path : Path) : List<FileLog.Entry>
  function filelog(path : String) : List<FileLog.Entry>
  function filelog(path : Path, maxRevs : int) : List<FileLog.Entry>
  function filelog(path : String, maxRevs : int) : List<FileLog.Entry>

  function fstat(path : Path) : Map<String, String>
  function fstat(path : String) : Map<String, String>

  function print(path : Path) : List<String>
  function print(path : String) : List<String>

  function run(op : String) : String
  function runUntil(op : String, accept(line : String) : boolean) : String
  function exec(op : String)
  function exec(op : String, handleStdOut(line : String))
  function run(op : String, handler : ProcessStarter.ProcessHandler)
}
