package gw.util.p4.base.impl
uses gw.util.p4.base.Fstat
uses java.util.Map
uses gw.util.p4.base.Path
uses java.util.regex.Pattern

class FstatImpl extends AbstractOperation implements Fstat {

  static var FSTAT_PAT = Pattern.compile("\\.\\.\\. (\\w+) (.*)")

  var _path : Path
  var _map : Map<String, String>

  construct(client : P4ClientImpl) {
    super(client)
  }

  override function on( path : Path ) : Map<String,String> {
    _path = path
    _map = {}
    run()
    return _map
  }

  override function getCommand() : String {
    return "fstat \"${_path}\""
  }

  override function handleLine( line : String ) {
    var matcher = FSTAT_PAT.matcher(line)
    if (matcher.matches()) {
      _map[matcher.group(1)] = matcher.group(2)
    }
  }
}
