package com.github.bchang.p4.blame;

/**
 * Created by IntelliJ IDEA.
 * User: bchang
 * Date: 8/13/11
 * Time: 2:31 AM
 * To change this template use File | Settings | File Templates.
 */
public interface IP4BlameListener {
  void lineDiscovered(IP4BlameLine line);
}
