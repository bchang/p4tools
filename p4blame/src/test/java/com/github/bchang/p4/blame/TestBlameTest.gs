package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.AbstractP4Test

class TestBlameTest extends AbstractP4Test {

  function testBlameForFileWithOneRev() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.forPathNoStart(file.Path)
    assertEquals(3, lines.length)
    assertEquals("1", lines[0].Line)
    assertEquals("2", lines[1].Line)
    assertEquals("3", lines[2].Line)
  }
}