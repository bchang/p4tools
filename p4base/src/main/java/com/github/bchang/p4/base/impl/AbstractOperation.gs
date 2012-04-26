package com.github.bchang.p4.base.impl

uses com.github.bchang.p4.base.P4UnmarshalledObject

abstract class AbstractOperation {

  var _client : P4ClientImpl

  protected construct(client : P4ClientImpl) {
    _client = client
  }

  protected function runForObjects() : List<P4UnmarshalledObject> {
    return _client.runForObjects(getCommand())
  }

  protected function runForRawOutput() : List<String> {
    return _client.runForRawOutput(getCommand())
  }

  protected function run() {
    _client.run(getCommand())
  }

  abstract function getCommand() : List<String>

  property get Verbose() : boolean { return _client.Verbose }
}
