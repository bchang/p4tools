package com.github.bchang.p4.blame

uses com.github.bchang.p4.base.FileLog
uses com.github.bchang.p4.base.P4Factory
uses com.github.bchang.p4.base.PathRev
uses java.util.ArrayList
uses java.util.List

enhancement PathRevEnhancement : PathRev {

  function combinedSourcePathRevs(logEntry : FileLog.Entry) : List<PathRev> {
    var ret = new ArrayList<PathRev>()
    if (this.Rev > 1) {
      ret.add(P4Factory.createPath(this.Path, this.Rev - 1))
    }
    for (sourceDetail in logEntry.Sources) {
      ret.add(sourceDetail.PathRev.EndPathRev)
    }
    return ret
  }
}
