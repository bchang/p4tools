package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.Fstat
uses java.util.Map
uses com.github.bchang.p4.base.Path
uses java.util.regex.Pattern

class FstatImpl extends AbstractOperation implements Fstat {

  var _path : Path

  construct(client : P4ClientImpl) {
    super(client)
  }

  override function run( path : Path ) : Map<String,String> {
    _path = path
    var p4obj = runForObjects().single()
    return p4obj.Dict
  }

  override function getCommand() : List<String> {
    return { "fstat", _path as String }
  }
}
