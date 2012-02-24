package com.github.bchang.p4.base;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:05 AM
 * To change this template use File | Settings | File Templates.
 */
public class Path {
  private static Pattern PATH_PAT = Pattern.compile("([^#]+)(#(\\d+)(,#(\\d+))?)?");

  public static Path create(String s) {
    Matcher pathMatcher = PATH_PAT.matcher(s);
    if (pathMatcher.matches()) {
      String path = pathMatcher.group(1);
      String rev = pathMatcher.group(3);
      String endRev = pathMatcher.group(5);
      if (endRev != null) {
        return PathRange.create(path, Integer.parseInt(rev), Integer.parseInt(endRev));
      }
      else if (rev != null) {
        return PathRev.create(path, Integer.parseInt(rev));
      }
      else {
        return new Path(path);
      }
    }
    else {
      throw new IllegalArgumentException("could not parse path from \"" + s + "\"");
    }
  }

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
    return toString().hashCode();
  }

  @Override
  public String toString() {
    return _path;
  }
}
