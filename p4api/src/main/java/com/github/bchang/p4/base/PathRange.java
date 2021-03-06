package com.github.bchang.p4.base;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:16 AM
 * To change this template use File | Settings | File Templates.
 */
public class PathRange extends PathRev {
  public static PathRange create(String p, int rev, int endRev) {
    return new PathRange(p, rev, endRev);
  }

  protected final int _endRev;

  protected PathRange(String p, int r, int endRev) {
    super(p, r);
    _endRev = endRev;
  }

  public int getEndRev() {
    return _endRev;
  }

  @Override
  public PathRev getEndPathRev() {
    return PathRev.create(_path, _endRev);
  }

  @Override
  public String toString() {
    return _path + "#" + _rev + "#" + _endRev;
  }
}
