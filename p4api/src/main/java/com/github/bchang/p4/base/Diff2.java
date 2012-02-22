package com.github.bchang.p4.base;

import gw.lang.reflect.interval.IntegerInterval;

import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:01 AM
 * To change this template use File | Settings | File Templates.
 */
public interface Diff2 {
  List<Entry> run(Path left, Path right);

  static interface Entry {
    String getOp();
    IntegerInterval getLeftRange();
    IntegerInterval getRightRange();
    List<String> getLeftLines();
    List<String> getRightLines();
  }
}
