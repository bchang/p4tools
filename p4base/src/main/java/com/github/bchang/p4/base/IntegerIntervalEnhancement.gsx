package com.github.bchang.p4.base

uses gw.lang.reflect.interval.IntegerInterval

enhancement IntegerIntervalEnhancement : IntegerInterval
{
  property get range() : int {
    return this.last() + 1 - this.first()
  }

  function copy() : IntegerInterval {
    return new IntegerInterval(this.first(), this.last())
  }
}
