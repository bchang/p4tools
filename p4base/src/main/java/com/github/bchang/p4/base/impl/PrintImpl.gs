package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.Print
uses com.github.bchang.p4.base.Path

class PrintImpl extends AbstractOperation implements Print {

  construct(client : P4ClientImpl) {
    super(client)
  }

  var _path : Path

  override function run( path : Path ) : List<String> {
    _path = path
    return runForRawOutput()
  }

  override function getCommand() : List<String> {
    return {"print", "-q", _path as String}
  }
}
