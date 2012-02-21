package com.github.bchang.p4.base

uses java.lang.String

enhancement P4TestStringEnhancement : String {
  function asPath() : Path {
    return P4Factory.createPath(this)
  }
}