package com.github.bchang.p4.base
uses java.util.Map

interface Fstat {

  function on(path : Path) : Map<String, String>  
}
