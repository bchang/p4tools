package com.github.bchang.p4.base.impl

uses com.github.bchang.p4.base.Path

/**
 */
class FileOperation extends AbstractOperation {
  var _p4Op : String
  var _paths : Path[]

  construct(client : P4ClientImpl, p4Op : String, paths : Path[]) {
    super(client)
    _p4Op = p4Op
    _paths = paths
  }

  override function getCommand() : String {
    // TODO might have to worry about the command line exceeding the shell's max length?
    return _p4Op + " " + _paths.join(" ")
  }

  override function handleLine(line : String) {
  }
}
