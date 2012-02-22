package com.github.bchang.p4.base

uses java.io.File

enhancement P4TestFileEnhancement : File {
  function asPath() : Path {
    return P4Factory.createPath(this.Path)
  }
}