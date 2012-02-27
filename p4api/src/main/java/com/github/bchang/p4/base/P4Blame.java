package com.github.bchang.p4.base;

import java.util.List;

/**
 */
public interface P4Blame {

  void addListener(Listener listener);
  List<Line> setup(Path path);
  void start();

  static interface Listener {
    void status(String status);
    void lineDiscovered(int lineNum, ChangeInfo info);
  }

  static interface Line {
    Integer getId();
    String getContent();
    ChangeInfo getChangeInfo();
  }

  static interface ChangeInfo {
    int getChange();
    String getDate();
    String getUser();
    String getPath();
    String getDescription();
  }
}
