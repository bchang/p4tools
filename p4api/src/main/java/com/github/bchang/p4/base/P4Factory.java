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

}
