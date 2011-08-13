package com.github.bchang.p4.base
uses gw.util.IntegerRange

class Diff2Test extends AbstractP4Test {

  function testAddLineAtTop() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    createFileAndSubmit(fileA, "A\nB\n")
    createFileAndSubmit(fileB, "X\nA\nB\n")
    var diff = P4.diff2(fileA.Path, fileB.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("a", 0, 0, 1, 1, {}, {"X"}, diff[0])
    diff = P4.diff2(fileB.Path, fileA.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("d", 1, 1, 0, 0, {"X"}, {}, diff[0])
  }

  function testAddLineInMiddle() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    createFileAndSubmit(fileA, "A\nB\n")
    createFileAndSubmit(fileB, "A\nX\nB\n")
    var diff = P4.diff2(fileA.Path, fileB.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("a", 1, 1, 2, 2, {}, {"X"}, diff[0])
    diff = P4.diff2(fileB.Path, fileA.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("d", 2, 2, 1, 1, {"X"}, {}, diff[0])
  }

  function testAddLineAtBottom() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    createFileAndSubmit(fileA, "A\nB\n")
    createFileAndSubmit(fileB, "A\nB\nX\n")
    var diff = P4.diff2(fileA.Path, fileB.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("a", 2, 2, 3, 3, {}, {"X"}, diff[0])
    diff = P4.diff2(fileB.Path, fileA.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("d", 3, 3, 2, 2, {"X"}, {}, diff[0])
  }

  function testChangeLineAtTop() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    createFileAndSubmit(fileA, "A\nB\n")
    createFileAndSubmit(fileB, "X\nY\nB\n")
    var diff = P4.diff2(fileA.Path, fileB.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("c", 1, 1, 1, 2, {"A"}, {"X", "Y"}, diff[0])
    diff = P4.diff2(fileB.Path, fileA.Path)
    assertEquals(1, diff.Count)
    assertDiffEntry("c", 1, 2, 1, 1, {"X", "Y"}, {"A"}, diff[0])
  }

  function testMultipleChanges() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    createFileAndSubmit(fileA, "A\nB\nC\nD\n")
    createFileAndSubmit(fileB, "X\nB\nY\nC\n")
    var diff = P4.diff2(fileA.Path, fileB.Path)
    assertEquals(3, diff.Count)
    assertDiffEntry("c", 1, 1, 1, 1, {"A"}, {"X"}, diff[0])
    assertDiffEntry("a", 2, 2, 3, 3, {}, {"Y"}, diff[1])
    assertDiffEntry("d", 4, 4, 4, 4, {"D"}, {}, diff[2])
    diff = P4.diff2(fileB.Path, fileA.Path)
    assertEquals(3, diff.Count)
    assertDiffEntry("c", 1, 1, 1, 1, {"X"}, {"A"}, diff[0])
    assertDiffEntry("d", 3, 3, 2, 2, {"Y"}, {}, diff[1])
    assertDiffEntry("a", 4, 4, 4, 4, {}, {"D"}, diff[2])
  }

  // test change lines
  // test multiple entries

  // test local file against depot file
  // test local file against specific revision of depot file
  // test revisions of same file
  // test specific revisions of different files

  private function assertDiffEntry(op : String, leftStart : int, leftEnd : int, rightStart : int, rightEnd : int, leftLines : List<String>, rightLines : List<String>, diffEntry : Diff2.Entry) {
    assertEquals(op, diffEntry.Op)
    assertIntegerRange(leftStart, leftEnd, diffEntry.LeftRange)
    assertIntegerRange(rightStart, rightEnd, diffEntry.RightRange)
    assertEquals(leftLines, diffEntry.LeftLines)
    assertEquals(rightLines, diffEntry.RightLines)
  }

  private function assertIntegerRange(expectedStart : int, expectedEnd : int, range : IntegerRange) {
    assertEquals(expectedStart, range.start)
    assertEquals(expectedEnd, range.end)
    assertEquals(1, range.step)
  }
}
