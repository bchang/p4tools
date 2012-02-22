package com.github.bchang.p4.base;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:05 AM
 * To change this template use File | Settings | File Templates.
 */
public class Path {

  protected final String _path;

  protected Path(String p) {
    _path = p;
  }

  public String getPath() {
    return _path;
  }

  @Override
  public boolean equals(Object obj) {
    return obj != null && obj instanceof Path && toString().equals(obj.toString());
  }

  @Override
  public int hashCode() {
    return _path.hashCode();
  }

  @Override
  public String toString() {
    return _path;
  }
}
