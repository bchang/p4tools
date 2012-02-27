package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.AbstractP4Test
uses com.github.bchang.p4.base.P4Blame.ChangeInfo
uses com.github.bchang.p4.base.P4Blame.Line
uses java.lang.Integer
uses org.fest.assertions.Assertions
uses org.fest.assertions.ListAssert

class TestBlameTest extends AbstractP4Test {

  function testPreStart() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "a\n" +
        "b\n" +
        "c\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(file.Path)
    Assertions.assertThat(lines.toList().map( \ elt -> elt.Content )).containsExactly({"a", "b", "c"})
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
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({0, 1, 2})
    assertThat(testBlame.Results.toList()).containsExactly({change, change, change})
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
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({2, 1, 0})
    assertThat(testBlame.Results.toList()).containsExactly({change1, change2, change3})
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
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({2, 1, 0})
    assertThat(testBlame.Results.toList()).containsExactly({change1, change2, change3})
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
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({0, 2, 1})
    assertThat(testBlame.Results.toList()).containsExactly({change3, change1, change3})
  }

  function testBlameForFileAcrossBranches2() {
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
        "3\n")
    var change4 = editFileAndSubmit(fileB,
        "a\n" +
        "2\n" +
        "c\n")
    /* var change5 = */ integFileAndSubmit(fileB, fileA)

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(fileA.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({2, 0, 1})
    assertThat(testBlame.Results.toList()).containsExactly({change3, change1, change4})
  }

  function testBlameForFileAcrossBranches3() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    var change1 = createFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n")
    /* var change2 = */ integFileAndSubmit(fileA, fileB)
    var change3 = editFileAndSubmit(fileB,
        "1\n" +
        "2\n" +
        "c\n")
    var change4 = editFileAndSubmit(fileA,
        "1\n" +
        "b\n" +
        "3\n")
    /* var change5 = */ integFileAndSubmit(fileB, fileA)

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(fileA.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({2, 1, 0})
    assertThat(testBlame.Results.toList()).containsExactly({change1, change4, change3})
  }

  function testBlameForFileAcrossBranches4() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    var change1 = createFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n")
    /* var change2 = */ integFileAndSubmit(fileA, fileB)
    var change3 = editFileAndSubmit(fileB,
        "1\n" +
        "2\n" +
        "c\n")
    var change4 = editFileAndSubmit(fileB,
        "a\n" +
        "2\n" +
        "c\n")
    /* var change5 = */ integFileAndSubmit(fileB, fileA)

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(fileA.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({0, 2, 1})
    assertThat(testBlame.Results.toList()).containsExactly({change4, change1, change3})
  }

  // this involves an edit during a merge
  function testBlameForFileAcrossBranches5() {
    var fileA = newUniqueFile()
    var fileB = newUniqueFile()
    var change1 = createFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n")
    /* var change2 = */ integFileAndSubmit(fileA, fileB)
    integFile(fileB, fileA)
    var change3 = editFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "c\n")

    var blame = new P4Blame(P4)
    var testBlame = new TestBlame(blame)
    var lines = testBlame.setup(fileA.Path)
    testBlame.start()
    Assertions.assertThat(testBlame.DiscoverySequenceByIndex).containsExactly({2, 0, 1})
    assertThat(testBlame.Results.toList()).containsExactly({change1, change1, change3})
  }

  private function assertThat(testBlameResults : List<ChangeInfo>) : ListAssert {
    var changes = testBlameResults.map( \ resultInfo -> resultInfo.Change )
    return Assertions.assertThat(changes)
  }

}
