package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.AbstractP4Test
uses java.lang.Integer
uses org.fest.assertions.Assertions

class TestBlameTest extends AbstractP4Test {

  function testPreStart() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(file.Path)
    assertEquals(3, lines.length)
    assertEquals("1", lines[0])
    assertEquals("2", lines[1])
    assertEquals("3", lines[2])
  }

  function testBlameForFileWithOneRev() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(file.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly(new Integer[] {0, 1, 2})
    assertEquals(change, testBlame.Results[0].ChangeInfo.Change)
    assertEquals(change, testBlame.Results[1].ChangeInfo.Change)
    assertEquals(change, testBlame.Results[2].ChangeInfo.Change)
  }

  function testBlameForFileWithManyRevs() {
    var file = newUniqueFile()
    var change1 = createFileAndSubmit(file,
        "1\n" +
        "1\n" +
        "1\n")
    var change2 = editFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "2\n")
    var change3 = editFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(file.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly(new Integer[] {2, 1, 0})
    assertEquals(change1, testBlame.Results[0].ChangeInfo.Change)
    assertEquals(change2, testBlame.Results[1].ChangeInfo.Change)
    assertEquals(change3, testBlame.Results[2].ChangeInfo.Change)
  }

  function testBlameForFileWithManyRevs2() {
    var file = newUniqueFile()
    var change1 = createFileAndSubmit(file,
        "1\n")
    var change2 = editFileAndSubmit(file,
        "1\n" +
        "2\n")
    var change3 = editFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(file.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly(new Integer[] {2, 1, 0})
    assertEquals(change1, testBlame.Results[0].ChangeInfo.Change)
    assertEquals(change2, testBlame.Results[1].ChangeInfo.Change)
    assertEquals(change3, testBlame.Results[2].ChangeInfo.Change)
  }

  function testBlameForFileAcrossBranches() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    var change1 = createFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n")
    /* var change2 = */ integFileAndSubmit(fileA, fileB)
    var change3 = editFileAndSubmit(fileB,
        "a\n" +
        "2\n" +
        "c\n")
    /* var change4 = */ integFileAndSubmit(fileB, fileA)

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(fileA.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly(new Integer[] {0, 2, 1})
    assertEquals(change3, testBlame.Results[0].ChangeInfo.Change)
    assertEquals(change1, testBlame.Results[1].ChangeInfo.Change)
    assertEquals(change3, testBlame.Results[2].ChangeInfo.Change)
  }
}
