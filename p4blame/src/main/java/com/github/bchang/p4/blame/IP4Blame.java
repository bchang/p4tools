package com.github.bchang.p4.blame;

/**
 */
public interface IP4Blame {

  void addListener(IP4BlameListener listener);
  String[] setup(String path);
  void start();
}
