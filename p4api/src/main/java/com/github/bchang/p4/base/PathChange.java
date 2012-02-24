package com.github.bchang.p4.base;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:10 AM
 * To change this template use File | Settings | File Templates.
 */
public class PathChange extends Path {
  public static PathChange create(String p, int change) {
    return new PathChange(p, change);
  }

  protected final int _change;

  protected PathChange(String p, int c) {
    super(p);
    _change = c;
  }

  public int getChange() {
    return _change;
  }

  @Override
  public String toString() {
    if (_change == 0) {
      return super.toString();
    }
    return _path + "@" + _change;
  }
}
