package com.github.bchang.p4.blame;

/**
 * Created by IntelliJ IDEA.
 * User: bchang
 * Date: 8/13/11
 * Time: 2:28 AM
 * To change this template use File | Settings | File Templates.
 */
public interface IP4Blame {

  void addListener(IP4BlameListener listener);
  IP4BlameLine[] forPathNoStart(String path);
  void start();
}
