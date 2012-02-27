package com.github.bchang.p4.blame

uses java.io.Writer
uses java.io.BufferedWriter
uses java.io.OutputStreamWriter
uses java.lang.System
uses com.github.bchang.p4.base.FileLog
uses java.util.List

class RecordList implements List<Record>
{
  delegate _del : List<Record> represents List<Record>
  var _title : String

  construct(title : String, records : List<Record>) {
    _del = records
    _title = title
  }

  final function dup() : RecordList {
    return new RecordList(null, _del.copy())
  }

  function display() {
    var writer = new BufferedWriter(new OutputStreamWriter(System.out, "UTF-8"))
    try {
      writeTo(writer)
    }
    finally {
      writer.flush()
    }
  }

  function writeTo(writer : Writer) {
    if (_title != null) writer.append(_title + "\n")

    var header = { "Change", "Date", "User", "Path", "", "Line"}

    var lineNumberColumnWidth = (this.Count as String).length()

    var c = { 7, 11, 10, 78, lineNumberColumnWidth, 1000 }
    var headerFmt = "%1$-"+c[0]+"s" + " %2$-"+c[1]+"s" + " %3$-"+c[2]+"s" + " %4$-"+c[3]+"s" + " %5$-"+c[4]+"s %6$-"+c[5]+"s"
    var rowFmt =    "%1$-"+c[0]+"s" + " %2$-"+c[1]+"s" + " %3$-"+c[2]+"s" + " %4$-"+c[3]+"s" + " %5$" +c[4]+"s %6$-"+c[5]+"s"

    writer.append(String.format(headerFmt, header.toTypedArray()).trim()).append("\n")
    for (rec in this index i) {
      writer.append(String.format(rowFmt, new String[] {
        rec.ChangeInfo.Change as String,
        rec.ChangeInfo.Date,
        rec.ChangeInfo.User,
        truncate(rec.ChangeInfo.Path, c[3], 0, "..."),
        (i + 1) as String,
        truncate(rec.Line, c[4], 1, "...")
      }).trim()).append("\n")
    }
  }

  static function truncate(str : String, maxLength : int, truncateWhere : int, dots : String) : String {
    if (str.length <= maxLength) {
      return str
    }
    if (truncateWhere < 0) {
      return dots + str.substring(str.length - maxLength + dots.length())
    }
    else if (truncateWhere > 0) {
      return str.substring(0, maxLength - dots.length) + dots
    }
    else {
      var leftLength = (maxLength - dots.length) / 2
      var rightLength = (maxLength - dots.length) - leftLength
      return str.substring(0, leftLength) + dots + str.substring(str.length - rightLength)
    }
  }

  function isComplete() : boolean {
    for (rec in this) {
      if (rec != null and rec.ChangeInfo == null) {
        return false
      }
    }
    return true
  }
}
