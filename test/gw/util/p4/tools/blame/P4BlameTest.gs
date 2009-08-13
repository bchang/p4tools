package gw.util.p4.tools.blame
uses gw.util.p4.base.AbstractP4Test

class P4BlameTest extends AbstractP4Test {


  function testBlameForFileWithOneRev() {
    var file = newUniqueFile()
    var change = createFileAndSubmit(file,
        "1\n" +
        "2\n" +
        "3\n")

    var recordList = new P4Blame(P4).forPath(file.Path)
    assertEquals(3, recordList.Count)
    assertRecord(change, "testuser", "//depot/${file.Name}#1", "1", recordList[0])
    assertRecord(change, "testuser", "//depot/${file.Name}#1", "2", recordList[1])
    assertRecord(change, "testuser", "//depot/${file.Name}#1", "3", recordList[2])
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
    assertEquals(5, recordList.Count)
    assertRecord(change1, "testuser", "//depot/${file.Name}#1", "2", recordList[0])
    assertRecord(change2, "testuser2", "//depot/${file.Name}#2", "3a", recordList[1])
    assertRecord(change1, "testuser", "//depot/${file.Name}#1", "4", recordList[2])
    assertRecord(change2, "testuser2", "//depot/${file.Name}#2", "a", recordList[3])
    assertRecord(change1, "testuser", "//depot/${file.Name}#1", "5", recordList[4])
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
    assertEquals(7, recordList.Count)
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "1", recordList[0])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "2", recordList[1])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "3", recordList[2])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "4", recordList[3])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "5", recordList[4])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "6", recordList[5])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "7", recordList[6])

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
    assertEquals(8, recordList.Count)
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "1a", recordList[0])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "2", recordList[1])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "3a", recordList[2])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "4", recordList[3])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "5", recordList[4])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "a", recordList[5])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "6", recordList[6])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "7", recordList[7])

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
    assertEquals(8, recordList.Count)
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "1a", recordList[0])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "2", recordList[1])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "3a", recordList[2])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "4", recordList[3])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "5", recordList[4])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "a", recordList[5])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "6", recordList[6])
    assertRecord(change4, "testuser", "//depot/${fileA.Name}#2", "7b", recordList[7])

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
    assertEquals(8, recordList.Count)
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "1a", recordList[0])
    assertRecord(change8, "testuser", "//depot/${fileA.Name}#5", "2b", recordList[1])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "3a", recordList[2])
    assertRecord(change7, "testuser", "//depot/${fileA.Name}#4", "4b", recordList[3])
    assertRecord(change9, "testuser", "//depot/${fileB.Name}#4", "5a", recordList[4])
    assertRecord(change3, "testuser", "//depot/${fileB.Name}#2", "a", recordList[5])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "6", recordList[6])
    assertRecord(change4, "testuser", "//depot/${fileA.Name}#2", "7b", recordList[7])
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
    assertEquals(4, recordList.Count)
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "A", recordList[0])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "B", recordList[1])
    assertRecord(change1, "testuser", "//depot/${fileA.Name}#1", "C", recordList[2])
    assertRecord(change3, "testuser", "//depot/${fileA.Name}#3", "D", recordList[3])
  }

  public function testExceptionThrownWhenForFileNotInDepot() {
  }

  public function testWithLocalChanges() {
  }

  public function testWithNonHeadRevision() {
  }

  private function assertRecord(change : int, user : String, path : String, line : String, rec : Record) {
    assertEquals(change, rec.LogEntry.Change)
    assertEquals(user, rec.LogEntry.User)
    assertEquals(path, rec.LogEntry.PathRev.toString())
    assertEquals(line, rec.Line)
  }
}
