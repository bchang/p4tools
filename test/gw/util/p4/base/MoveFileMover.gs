package gw.util.p4.base
uses java.io.File

class MoveFileMover extends FileMover {

  construct(test : AbstractP4Test) {
    super(test)
  }

  override function moveFile(fromFile : File, toFile : File) {
    print("Test moving ${fromFile.Path} to ${toFile.Path}")
    _test.p4("move \"${fromFile.Path}\" \"${toFile.Path}\"")
  }

}
