package com.github.bchang.p4.base;

import gw.test.Suite;
import junit.framework.Test;

/**
 * Created by IntelliJ IDEA.
 * User: bchang
 * Date: 8/12/11
 * Time: 9:52 PM
 * To change this template use File | Settings | File Templates.
 */
public class P4BaseSuite extends Suite {
  public static Test suite() {
    return new P4BaseSuite().withPackages("com.github.bchang.p4");
  }
}
