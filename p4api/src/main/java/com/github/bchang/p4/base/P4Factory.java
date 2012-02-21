package com.github.bchang.p4.base;

import gw.lang.reflect.ReflectUtil;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:27 AM
 * To change this template use File | Settings | File Templates.
 */
public class P4Factory {

  public static P4Client createP4() {
    return createP4(null, 0, null, null);
  }

  public static P4Client createP4(String host, int port, String client, String user) {
    return createP4(host, port, client, user, false);
  }

  public static P4Client createP4(String host, int port, String client, String user, boolean verbose) {
    return createP4(host, port, client, user, verbose, false);
  }

  public static P4Client createP4(String host, int port, String client, String user, boolean verbose, boolean recordStats) {
    return (P4Client) ReflectUtil.construct("com.github.bchang.p4.base.impl.P4ClientImpl", host, port, client, user, verbose, recordStats);
  }

  private static Pattern PATH_PAT = Pattern.compile("([^#]+)(#(\\d+)(,#(\\d+))?)?");

  public static Path createPath(String s) {
    Matcher pathMatcher = PATH_PAT.matcher(s);
    if (pathMatcher.matches()) {
      String path = pathMatcher.group(1);
      String rev = pathMatcher.group(3);
      String endRev = pathMatcher.group(5);
      if (endRev != null) {
        return createPath(path, Integer.parseInt(rev), Integer.parseInt(endRev));
      }
      else if (rev != null) {
        return createPath(path, Integer.parseInt(rev));
      }
      else {
        return new Path(path);
      }
    }
    else {
      throw new IllegalArgumentException("could not parse path from \"" + s + "\"");
    }
  }

  public static PathRev createPath(String p, int rev) {
    return new PathRev(p, rev);
  }

  public static PathRange createPath(String p, int rev, int endRev) {
    return new PathRange(p, rev, endRev);
  }

  public static PathChange createPathChange(String p, int change) {
    return new PathChange(p, change);
  }
}
