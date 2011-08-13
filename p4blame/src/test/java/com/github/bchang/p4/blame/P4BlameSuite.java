package com.github.bchang.p4.blame;

import gw.test.Suite;
import junit.framework.Test;

/**
 * Created by IntelliJ IDEA.
 * User: bchang
 * Date: 8/12/11
 * Time: 10:34 PM
 * To change this template use File | Settings | File Templates.
 */
public class P4BlameSuite extends Suite {
  public static Test suite() {
    if (System.getProperty("testclass") != null) {
      return new P4BlameSuite().withTest(System.getProperty("testclass"));
    }
    return new P4BlameSuite().withPackages("com.github.bchang.p4.blame");
  }
}
