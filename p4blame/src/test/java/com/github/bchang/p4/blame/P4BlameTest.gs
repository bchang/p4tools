package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.AbstractP4Test
uses java.lang.*
uses org.fest.assertions.Assertions
uses org.fest.assertions.ListAssert

class P4BlameTest extends AbstractP4Test {


  function testBlameForFileWithOneRev() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var recordList = new P4Blame(P4).forPath(file.Path)
    assertThat(recordList).containsExactly({
        "${change}:testuser://depot/${file.Name}#1:1",
        "${change}:testuser://depot/${file.Name}#1:2",
        "${change}:testuser://depot/${file.Name}#1:3"
    })
  }

  function testBlameForFileWithTwoRevs() {
    var file = newUniqueFile()
    var change1 = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n" +
        "4\n" +
        "5\n")

    P4.User = "testuser2"
    saveClient()

    var change2 = editFileAndSubmit(file,
        "2\n" +
        "3a\n" +
        "4\n" +
        "a\n" +
        "5\n")

    var recordList = new P4Blame(P4).forPath(file.Path)
    assertThat(recordList).containsExactly({
        "${change1}:testuser://depot/${file.Name}#1:2",
        "${change2}:testuser2://depot/${file.Name}#2:3a",
        "${change1}:testuser://depot/${file.Name}#1:4",
        "${change2}:testuser2://depot/${file.Name}#2:a",
        "${change1}:testuser://depot/${file.Name}#1:5"
    })
  }

  function testBlameForFileHistoryAcrossIntegs() {
    var fileA = newUniqueFile()
    var change1 = createFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n" +
        "4\n" +
        "5\n" +
        "6\n" +
        "7\n")

    var fileB = newUniqueFile()
    /* var change2 = */ integFileAndSubmit(fileA, fileB)
    var recordList = new P4Blame(P4).forPath(fileB.Path)
    assertThat(recordList).containsExactly({
        "${change1}:testuser://depot/${fileA.Name}#1:1",
        "${change1}:testuser://depot/${fileA.Name}#1:2",
        "${change1}:testuser://depot/${fileA.Name}#1:3",
        "${change1}:testuser://depot/${fileA.Name}#1:4",
        "${change1}:testuser://depot/${fileA.Name}#1:5",
        "${change1}:testuser://depot/${fileA.Name}#1:6",
        "${change1}:testuser://depot/${fileA.Name}#1:7"
    })

    var change3 = editFileAndSubmit(fileB,
        "1a\n" +
        "2\n" +
        "3a\n" +
        "4\n" +
        "5\n" +
        "a\n" +
        "6\n" +
        "7\n")
    recordList = new P4Blame(P4).forPath(fileB.Path)
    assertThat(recordList).containsExactly({
        "${change3}:testuser://depot/${fileB.Name}#2:1a",
        "${change1}:testuser://depot/${fileA.Name}#1:2",
        "${change3}:testuser://depot/${fileB.Name}#2:3a",
        "${change1}:testuser://depot/${fileA.Name}#1:4",
        "${change1}:testuser://depot/${fileA.Name}#1:5",
        "${change3}:testuser://depot/${fileB.Name}#2:a",
        "${change1}:testuser://depot/${fileA.Name}#1:6",
        "${change1}:testuser://depot/${fileA.Name}#1:7"
    })

    var change4 = editFileAndSubmit(fileA,
        "1\n" +
        "2\n" +
        "3\n" +
        "4\n" +
        "5\n" +
        "6\n" +
        "7b\n")
    /* var change5 = */ integFileAndSubmit(fileA, fileB)
    recordList = new P4Blame(P4).forPath(fileB.Path)
    assertThat(recordList).containsExactly({
        "${change3}:testuser://depot/${fileB.Name}#2:1a",
        "${change1}:testuser://depot/${fileA.Name}#1:2",
        "${change3}:testuser://depot/${fileB.Name}#2:3a",
        "${change1}:testuser://depot/${fileA.Name}#1:4",
        "${change1}:testuser://depot/${fileA.Name}#1:5",
        "${change3}:testuser://depot/${fileB.Name}#2:a",
        "${change1}:testuser://depot/${fileA.Name}#1:6",
        "${change4}:testuser://depot/${fileA.Name}#2:7b"
    })

    /* var change6 = */ integFileAndSubmit(fileB, fileA)
    var change7 = editFileAndSubmit(fileA,
        "1a\n" +
        "2\n" +
        "3a\n" +
        "4b\n" + //<--
        "5\n" +
        "a\n" +
        "6\n" +
        "7b\n")
    var change8 = editFileAndSubmit(fileA,
        "1a\n" +
        "2b\n" + //<--
        "3a\n" +
        "4b\n" +
        "5\n" +
        "a\n" +
        "6\n" +
        "7b\n")

    integFile(fileA, fileB)
    var change9 = editFileAndSubmit(fileB,
        "1a\n" +
        "2b\n" +
        "3a\n" +
        "4b\n" +
        "5a\n" + //<--
        "a\n" +
        "6\n" +
        "7b\n")
    recordList = new P4Blame(P4).forPath(fileB.Path)
    assertThat(recordList).containsExactly({
        "${change3}:testuser://depot/${fileB.Name}#2:1a",
        "${change8}:testuser://depot/${fileA.Name}#5:2b",
        "${change3}:testuser://depot/${fileB.Name}#2:3a",
        "${change7}:testuser://depot/${fileA.Name}#4:4b",
        "${change9}:testuser://depot/${fileB.Name}#4:5a",
        "${change3}:testuser://depot/${fileB.Name}#2:a",
        "${change1}:testuser://depot/${fileA.Name}#1:6",
        "${change4}:testuser://depot/${fileA.Name}#2:7b"
    })
  }

  public function testBlameForFileWhichIsRenamedAndThenRenamedBack() {
    var fileA = newUniqueFile()
    var change1 = createFileAndSubmit(fileA, "A\nB\nC\n")
    var fileB = newUniqueFile()
    moveFileAndSubmit(fileA, fileB)

    print("Test moving ${fileA.Path} to ${fileB.Path}")
    p4("integ -f \"${fileB.Path}\" \"${fileA.Path}\"")
    deleteFile(fileB)
    editFile(fileA, "A\nB\nC\nD\n")
    var change3 = submit({fileA, fileB}, "test moved file")

    var recordList = new P4Blame(P4).forPath(fileA.Path)
    assertThat(recordList).containsExactly({
        "${change1}:testuser://depot/${fileA.Name}#1:A",
        "${change1}:testuser://depot/${fileA.Name}#1:B",
        "${change1}:testuser://depot/${fileA.Name}#1:C",
        "${change3}:testuser://depot/${fileA.Name}#3:D"
    })
  }

  public function testExceptionThrownWhenForFileNotInDepot() {
    var file = newUniqueFile()
    try {
      new P4Blame(P4).forPath(file.Path)
      fail("should have caught IllegalArgumentException")
    }
    catch (e : IllegalArgumentException) {
      assertEquals("No such file in depot: ${file.Path}", e.Message)
    }
  }

  public function testWithLocalChanges() {
  }

  public function testWithNonHeadRevision() {
    var file = newUniqueFile()
    var change1 = createFileAndSubmit(file, "A\nB\nC\n")
    var change2 = editFileAndSubmit(file, "A\nB\nC\nD\n")

    var recordList = new P4Blame(P4).forPath(file.Path + "#1")
    assertThat(recordList).containsExactly({
        "${change1}:testuser://depot/${file.Name}#1:A",
        "${change1}:testuser://depot/${file.Name}#1:B",
        "${change1}:testuser://depot/${file.Name}#1:C"
    })

    recordList = new P4Blame(P4).forPath(file.Path + "#2")
    assertThat(recordList).containsExactly({
        "${change1}:testuser://depot/${file.Name}#1:A",
        "${change1}:testuser://depot/${file.Name}#1:B",
        "${change1}:testuser://depot/${file.Name}#1:C",
        "${change2}:testuser://depot/${file.Name}#2:D"
    })
  }

  function assertThat(recordList : RecordList) : ListAssert {
    var stringEntries = recordList.map( \ rec -> rec.ChangeInfo.Change + ":" + rec.ChangeInfo.User + ":" + rec.ChangeInfo.Path + ":" + rec.Line )
    return Assertions.assertThat(stringEntries)
  }
}
