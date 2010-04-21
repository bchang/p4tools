#!/usr/bin/env gosu

classpath "../src"

uses gw.lang.cli.CommandLineAccess
uses gw.util.p4.tools.blame.P4Blame

if (CommandLineAccess.getRawArgs().Count != 1) {
  java.lang.System.err.println("Usage: " + CommandLineAccess.getCurrentProgram() + " <file to annotate>")
  java.lang.System.exit(-1)
}

var _arg = CommandLineAccess.getRawArgs()[0]
new P4Blame().forPath(_arg).display()

