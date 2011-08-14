package com.github.bchang.p4.blame;

/**
 */
interface IP4Blame {
  function addListener(listener : IP4BlameListener)
  function setup(path : String) : String[]
  function start()
}
