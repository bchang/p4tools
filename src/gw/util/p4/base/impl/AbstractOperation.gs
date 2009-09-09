package gw.util.p4.base.impl

abstract class AbstractOperation {

  var _client : P4ClientImpl

  protected construct(client : P4ClientImpl) {
    _client = client
  }

  protected function run() {
    _client.run(this)
  }

  abstract function getCommand() : String

  abstract function handleLine(line : String)

  function handleErrLine( line : String ) {
    throw "ow ow ow! ${line}"
  }

  property get Verbose() : boolean { return _client.Verbose }
}
