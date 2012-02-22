package com.github.bchang.p4.base;

import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 2/21/12
 * Time: 12:44 AM
 * To change this template use File | Settings | File Templates.
 */
public interface Fstat {
  Map<String, String> run(Path path);
}
