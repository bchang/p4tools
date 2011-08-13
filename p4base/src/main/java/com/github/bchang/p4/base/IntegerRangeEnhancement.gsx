package com.github.bchang.p4.base

uses gw.util.IntegerRange

enhancement IntegerRangeEnhancement : IntegerRange
{
  property get range() : int {
    return this.end + 1 - this.start
  }

  function copy() : IntegerRange {
    return new IntegerRange(this.start, this.end)
  }
}
