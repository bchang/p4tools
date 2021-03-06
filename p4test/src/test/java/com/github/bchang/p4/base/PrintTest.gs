package com.github.bchang.p4.base

class PrintTest extends AbstractP4Test {

  function testOneRev() {
    var file = newUniqueFile()
    createFileAndSubmit(file, "here is my content\nA\nB\nC\n")

    var expected = {"here is my content", "A", "B", "C"}
    assertEquals(expected, P4.print(file.asPath()))
    assertEquals(expected, P4.print("${file.Path}#1".asPath()))
    assertEquals(expected, P4.print("//depot/${file.Name}".asPath()))
    assertEquals(expected, P4.print("//depot/${file.Name}#1".asPath()))
    assertEquals(expected, P4.print(Path.create(file.Path)))
    assertEquals(expected, P4.print(PathRev.create(file.Path, 1)))
    assertEquals(expected, P4.print(Path.create("//depot/${file.Name}")))
    assertEquals(expected, P4.print(PathRev.create("//depot/${file.Name}", 1)))
  }

  function testTwoRevs() {
    var file = newUniqueFile()
    createFileAndSubmit(file, "here is my content\nA\nB\nC\n")
    editFileAndSubmit(file, "here is my content\nA\nB\nC\nD\nE\n")

    var expected1 = {"here is my content", "A", "B", "C"}
    var expected2 = {"here is my content", "A", "B", "C", "D", "E"}

    assertEquals(expected1, P4.print("${file.Path}#1".asPath()))
    assertEquals(expected1, P4.print("//depot/${file.Name}#1".asPath()))
    assertEquals(expected1, P4.print(PathRev.create(file.Path, 1)))
    assertEquals(expected1, P4.print(PathRev.create("//depot/${file.Name}", 1)))

    assertEquals(expected2, P4.print(file.asPath()))
    assertEquals(expected2, P4.print("${file.Path}#2".asPath()))
    assertEquals(expected2, P4.print("//depot/${file.Name}".asPath()))
    assertEquals(expected2, P4.print("//depot/${file.Name}#2".asPath()))
    assertEquals(expected2, P4.print(Path.create(file.Path)))
    assertEquals(expected2, P4.print(PathRev.create(file.Path, 2)))
    assertEquals(expected2, P4.print(Path.create("//depot/${file.Name}")))
    assertEquals(expected2, P4.print(PathRev.create("//depot/${file.Name}", 2)))
  }
}
