package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.Print
uses com.github.bchang.p4.base.Path

class PrintImpl extends AbstractOperation implements Print {

  construct(client : P4ClientImpl) {
    super(client)
  }

  var _path : Path
  var _list : List<String>
  var _firstLine = true

  override function on( path : Path ) : List<String> {
    _path = path
    _list = {}
    run()
    return _list
  }

  override function getCommand() : String {
    return "print \"${_path}\""
  }

  override function handleLine( line : String ) {
    if (_firstLine) {
      if (!line.matches("//depot/[^#]+#\\d+ - .*")) {
        throw "PrintImpl: unexpected format of first line: ${line}"
      }
      _firstLine = false
    }
    else {
      _list.add(line)
    }
  }

}
