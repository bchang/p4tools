package com.github.bchang.p4.base

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 8/6/12
 * Time: 12:27 PM
 * To change this template use File | Settings | File Templates.
 */
class FilelogTest extends AbstractP4Test {

  function testFilelog() {
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
    assertEquals(3, P4.filelog(file.asPath()).Count)
    assertEquals(2, P4.filelog(file.asPath(), 2).Count)
  }

}
