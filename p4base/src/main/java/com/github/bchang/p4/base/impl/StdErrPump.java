package com.github.bchang.p4.base.impl;

import gw.util.GosuExceptionUtil;
import gw.util.StreamUtil;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;

/**
 * Created with IntelliJ IDEA.
 * User: bchang
 * Date: 8/6/12
 * Time: 6:10 PM
 * To change this template use File | Settings | File Templates.
 */
public class StdErrPump extends Thread {

  private InputStream _errorStream;

  public synchronized void attachErrorStream(InputStream errorStream) {
    _errorStream = errorStream;
    notify();
  }

  @Override
  public synchronized void run() {
    while (true) {
      if (_errorStream != null) {
        pumpStreamToStderr(_errorStream);
        _errorStream = null;
      } else {
        try {
          wait();
        }
        catch (InterruptedException e) {
          System.err.println("StdErrPump caught InterruptedException");
          break;
        }
      }
    }
  }

  private static void pumpStreamToStderr(InputStream errorStream) {
    BufferedReader reader = null;
    try {
      reader = new BufferedReader(StreamUtil.getInputStreamReader(errorStream));
      while (true) {
        String line = reader.readLine();
        if (line == null) {
          break;
        }
        System.err.println(line);
      }
    } catch (IOException e) {
      throw GosuExceptionUtil.forceThrow(e);
    } finally {
      try {
        StreamUtil.close(reader);
      } catch (IOException e) {
        System.err.println("StdErrPump caught IOException");
      }
    }
  }
}
