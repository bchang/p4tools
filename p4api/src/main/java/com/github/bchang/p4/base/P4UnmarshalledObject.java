package com.github.bchang.p4.base;

import java.util.HashMap;
import java.util.Map;

/**
 */
public class P4UnmarshalledObject {

  private Map<String, String> _dict = new HashMap<String, String>();
  private Map<String, Integer> _codes = null;

  public Map<String, String> getDict() {
    return _dict;
  }

  public Map<String, Integer> getCodes() {
    return _codes;
  }

  public void addDictEntry(String key, String val) {
    _dict.put(key, val);
  }

  public void addCode(String key, Integer val) {
    if (_codes == null) {
      _codes = new HashMap<String, Integer>();
    }
    _codes.put(key, val);
  }
}
