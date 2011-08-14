package com.github.bchang.p4.blame;

/**
 */
interface IP4BlameListener {
  function status(status : String)
  function lineDiscovered(line : IP4BlameLine)
}
