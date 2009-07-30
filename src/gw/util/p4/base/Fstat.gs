package gw.util.p4.base
uses java.util.Map

interface Fstat {

  function on(path : Path) : Map<String, String>  
}
