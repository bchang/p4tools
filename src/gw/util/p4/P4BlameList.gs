package gw.util.p4
uses java.io.File
uses java.util.HashMap

class P4BlameList
{

  static function execute(pathHead : String, listFile : File) {
    var counter = 0
    listFile.eachLine(\ line -> {
      counter++
      var relPath = line
      if (relPath.startsWith(pathHead)) {
        relPath = relPath.substring(pathHead.length)
      }
      relPath = relPath.replaceAll( "#\\d+$", "" )

      var records = new P4Blame().forPath(line)

      var changes = new HashMap<int, String>()
      for (rec in records) {
        if (rec.LogEntry != null and rec.LogEntry.Change > 0) {
          changes.put(rec.LogEntry.Change, rec.LogEntry.User)
        }
      }
      print(line + "|" + (changes as String))
    })
  }
}
