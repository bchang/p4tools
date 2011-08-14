package com.github.bchang.p4.blame;

uses java.lang.Integer

/**
 */
interface IP4BlameLine {
  property get Id() : Integer
  property get ChangeInfo() : IP4ChangeInfo
}
