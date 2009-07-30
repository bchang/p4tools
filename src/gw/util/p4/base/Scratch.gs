package gw.util.p4.base

class Scratch {

  static function foo() {
    var p4 = P4Factory.createP4()

    var filelog = p4.filelog("/eng/cmerge/All.ipr#2")
    for (entry in filelog) {
      print("${entry.PathRev} ${entry.Change} ${entry.Op} ${entry.Date} ${entry.User}")
      for (detail in entry.Sources) {
        print("  ${detail.SubOp} ${detail.Direction} ${detail.PathRev}")
      }
    }

//    var diff2 = p4.diff2("/eng/cmerge/All.ipr#36", "/eng/cmerge/All.ipr")
//    for (entry in diff2) {
//      print(entry)
//    }
//    
//    var fstat = p4.fstat("/eng/cmerge/All.ipr")
//    for (entry in fstat.entrySet()) {
//      print(entry)
//    }
//
//    for (line in p4.print("/eng/cmerge/All.ipr")) {
//      print(line)
//    }
  }

}
