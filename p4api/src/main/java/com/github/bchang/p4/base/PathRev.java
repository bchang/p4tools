package com.github.bchang.p4.base;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:14 AM
 * To change this template use File | Settings | File Templates.
 */
public class PathRev extends Path {
  protected final int _rev;

  protected PathRev(String p, int r) {
    super(p);
    _rev = r;
  }

  public int getRev() {
    return _rev;
  }

  @Override
  public String toString() {
    if (_rev == 0) {
      return super.toString();
    }
    return _path + "#" + _rev;
  }
}
