package com.github.bchang.p4.blame;

/**
 * Created by IntelliJ IDEA.
 * User: bchang
 * Date: 8/13/11
 * Time: 2:28 AM
 * To change this template use File | Settings | File Templates.
 */
public class SwingBlame implements IP4BlameListener {

  private final IP4Blame _blame;
  private IP4BlameLine[] _lines;

  public SwingBlame(IP4Blame blame) {
    _blame = blame;
    _blame.addListener(this);
  }

  public void start(String path) {
    _lines = _blame.forPathNoStart(path);
    _blame.start();
  }

  public void lineDiscovered(IP4BlameLine line) {
    _lines[line.getId()] = line;
  }
}
