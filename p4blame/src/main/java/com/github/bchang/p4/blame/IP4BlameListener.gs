package com.github.bchang.p4.blame;

uses com.github.bchang.p4.base.IP4BlameLine

/**
 */
interface IP4BlameListener {
  function status(status : String)
  function lineDiscovered(line : IP4BlameLine)
}
