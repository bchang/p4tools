package com.github.bchang.p4.base.impl

uses java.io.File
uses java.lang.StringBuilder
uses java.lang.System
uses com.github.bchang.p4.base.Path

abstract class AbstractOperation {

  static function abbreviatePath(p : Path) :String{
    var elements = p.toString().split("/")
    var sb = new StringBuilder()
    for (elt in elements index i) {
      if (elt != null && elt.length() > 0 ) {
        if (i < elements.Count - 1) {
          sb.append(elt.charAt(0)).append("_")
        }
        else {
          sb.append("/").append(elt)
        }
      }
    }
    return sb.toString()
  }

  var _cacheDir : File
  var _client : P4ClientImpl

  protected construct(client : P4ClientImpl) {
    _client = client
    var cachePath = System.getProperty("cachePath")
    if (cachePath != null) {
      _cacheDir = new File(cachePath)
    }
  }

  protected function run() {
    var cacheFile : File
    if (_cacheDir != null) {
      var cacheAddress = getCacheAddress()
      if (cacheAddress != null) {
        cacheFile = new File(_cacheDir, getCacheAddress())
      }
    }
    if (cacheFile != null && cacheFile.exists()) {
      cacheFile.eachLine(\ line -> handleLine(line))
    }
    else {
      _client.p4process(getCommand())
          .withStdOutHandler(\ line -> handleLine(line))
          .withStdErrHandler(\ line -> handleLine(line))
          .exec()
    }
  }

  function getCacheAddress() : String {
    return null
  }

  abstract function getCommand() : String

  abstract function handleLine(line : String)

  function handleErrLine( line : String ) {
    throw "ow ow ow! ${line}"
  }

  property get Verbose() : boolean { return _client.Verbose }
}
