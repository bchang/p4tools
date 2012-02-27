package com.github.bchang.p4.base;

import gw.util.Predicate;
import gw.util.ProcessStarter;

import java.util.List;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:46 AM
 * To change this template use File | Settings | File Templates.
 */
public interface P4Client {
  String getHost();
  int getPort();
  void setHost(String host);
  void setPort(int port);
  String getClient();
  void setClient(String client);
  String getUser();
  void setUser(String u);

  void clearStats();
  void printStats();

  void add(Path... paths);
  void edit(Path... paths);
  void delete(Path... paths);
  void revert(Path... paths);

  List<Diff2.Entry> diff2(Path left, Path right);
  List<FileLog.Entry> filelog(Path path);
  List<FileLog.Entry> filelog(Path path, int maxrevs);
  Map<String, String> fstat(Path path);
  List<String> print(Path path);

  List<P4Blame.Line> blame(Path path);

  String run(String op);
  String runUntil(String op, Predicate<String> accept);
  void exec(String op);
  void exec(String op, ProcessStarter.OutputHandler handler);
  void run(String op, ProcessStarter.ProcessHandler handler);
}
