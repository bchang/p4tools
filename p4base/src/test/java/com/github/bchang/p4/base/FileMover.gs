package com.github.bchang.p4.base
uses java.io.File

abstract class FileMover {

  protected var _test : AbstractP4Test

  construct(test : AbstractP4Test) {
    _test = test
  }

  function moveFileAndSubmit(fromFile : File, toFile : File) : int {
    moveFile(fromFile, toFile)
    return _test.submit({fromFile, toFile}, "test moved file")
  }

  abstract function moveFile(fromFile : File, toFile : File)

}
