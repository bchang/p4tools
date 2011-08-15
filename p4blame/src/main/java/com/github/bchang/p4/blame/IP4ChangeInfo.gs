package com.github.bchang.p4.blame;

/**
 */
public interface IP4ChangeInfo {
  property get Change() : int
  property get Date() : String
  property get User() : String
  property get Path() : String
  property get Description() : String
}
