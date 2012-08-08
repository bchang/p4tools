#!/usr/bin/env gosu

classpath "../p4base/src/main/java,../p4blame/src/main/java,../p4api/target/classes,../p4base/target/classes"

uses gw.lang.cli.CommandLineAccess
uses com.github.bchang.p4.base.P4Factory
uses com.github.bchang.p4.blame.P4Blame
uses com.github.bchang.p4.blame.swing.SwingBlame
uses java.lang.System

function printHelp() {
  print("Usage: gosu ${CommandLineAccess.getCurrentProgram()} [-c path] [-h]")
  print("Options:")
  print("    -g             start a graphical frame (this is the default if no arguments are given)")
  print("    -c <path>      run blame on the given depot or local path and print to console")
  print("    -h             show this help")
  print("    -help              ''")
  print("    --help             ''")
}

var consoleMode : boolean
var path : String

var i = 0
while (true) {
  if (i == CommandLineAccess.getRawArgs().Count) {
    break
  }
  var arg = CommandLineAccess.getRawArgs()[i]
  if (arg == "-h" || arg == "-help" || arg == "--help") {
    printHelp()
    System.exit(0)
  }
  else if (arg == "-c") {
    if (i == CommandLineAccess.getRawArgs().Count - 1) {
      print("-c argument should be followed by a path - run \"${CommandLineAccess.getCurrentProgram()} -help\" for details")
      System.exit(-1)
    }
    consoleMode = true
    i++
    path = CommandLineAccess.getRawArgs()[i]
  }
  else if (arg == "-g") {
  }
  else if (i == CommandLineAccess.getRawArgs().Count - 1) {
    path = CommandLineAccess.getRawArgs()[i]
  }
  else {
    print("unrecognized option: ${arg} - run \"${CommandLineAccess.getCurrentProgram()} -help\" for details")
    System.exit(-1)
  }
  i++
}

var p4 = P4Factory.createP4()
var blame = new P4Blame(p4)
if (consoleMode) {
  blame.forPath(path).display()
}
else {
  var frame = new SwingBlame(blame, path)
  frame.Visible = true
}
