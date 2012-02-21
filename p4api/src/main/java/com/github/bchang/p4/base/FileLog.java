package com.github.bchang.p4.base;

import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:41 AM
 * To change this template use File | Settings | File Templates.
 */
public interface FileLog {
  List<Entry> run(Path path);
  List<Entry> run(Path path, int maxRevs);

  static interface Entry {
    PathRev getPathRev();
    int getChange();
    String getOp();
    String getDate();
    String getUser();

    static interface Detail {
      String getSubOp();
      String getDirection();
      PathRev getPathRev();
    }
  }
}
