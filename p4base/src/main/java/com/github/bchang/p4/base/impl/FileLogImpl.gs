package com.github.bchang.p4.base.impl
uses com.github.bchang.p4.base.FileLog
uses com.github.bchang.p4.base.PathRange
uses com.github.bchang.p4.base.Path
uses java.util.regex.Pattern
uses com.github.bchang.p4.base.PathRev
uses com.github.bchang.p4.base.P4Factory
uses java.util.List
uses java.util.Date
uses java.text.SimpleDateFormat
uses java.lang.Integer
uses java.util.StringTokenizer

class FileLogImpl extends AbstractOperation implements FileLog {

  static var DATE_FMT = new SimpleDateFormat("yyyy/MM/dd")

  var _path : Path
  var _maxRevs : int

  protected construct(client : P4ClientImpl) {
    super(client)
  }

  override function run(p : Path) : List<EntryImpl> {
    return run(p, 0)
  }

  override function run(p : Path, maxRevs : int) : List<EntryImpl> {
    if (p typeis PathRange) {
      p = PathRev.create(p.Path, p.EndRev)
    }
    _path = p
    _maxRevs = maxRevs == 0 ? Integer.MAX_VALUE : maxRevs
    var list : List<EntryImpl> = {}
    var p4obj = runForObjects().single()
    var dict = p4obj.Dict

    var i = 0
    while (true) {
      if (i == _maxRevs || dict["rev" + i] == null) {
        break
      }
      var entry = new EntryImpl() {
        :PathRev = PathRev.create(_path.Path, dict["rev" + i].toInt()),
        :Change = dict["change" + i].toInt(),
        :Op = dict["action" + i],
        :Date = DATE_FMT.format(new Date(dict["time" + i].toLong())),
        :User = dict["user" + i]
      }
      var j = 0
      while (true) {
        var how = dict["how" + i + "," + j]
        if (how == null) {
          break
        }
        var tokenizer = new StringTokenizer(how)
        if (tokenizer.countTokens() == 2) {
          var detail = new DetailImpl() {
            :SubOp = tokenizer.nextToken(),
            :Direction = tokenizer.nextToken(),
            :PathRev = PathRev.create(dict["file" + i + "," + j], dict["erev" + i + "," + j].substring(1).toInt())
          }
          if (detail.Direction == "from") {
            entry.Sources.add(detail)
          }
          else if (detail.Direction == "into") {
            entry.Targets.add(detail)
          }
        }
        j++
      }
      list.add(entry)
      i++
    }
    return list
  }

  override function getCommand() : List<String> {
    var command = {"filelog"}
    if (_maxRevs > 0) {
      command.add("-m")
      command.add(_maxRevs as String)
    }
    command.add(_path as String)
    return command
  }

  static class EntryImpl implements FileLog.Entry {

    var _pathRev : PathRev as PathRev
    var _change : int as Change
    var _op : String as Op
    var _date : String as Date
    var _user : String as User
    var _sources : List<? extends FileLog.EntryDetail> as Sources
    var _targets : List<? extends FileLog.EntryDetail> as Targets

    construct() {
      Sources = {}
      Targets = {}
    }

    override function toString() : String {
      return "#${PathRev.Rev} change ${Change} ${Op} on ${Date} by ${User}"
    }
  }

  static class DetailImpl implements FileLog.EntryDetail {
    var _subOp : String as SubOp
    var _direction : String as Direction
    var _pathRev : PathRev as PathRev

    override function toString() : String {
      return "${SubOp} ${Direction} ${PathRev}"
    }
  }
}
