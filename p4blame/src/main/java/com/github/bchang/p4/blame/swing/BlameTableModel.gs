package com.github.bchang.p4.blame.swing;

uses com.github.bchang.p4.blame.IP4ChangeInfo

uses gw.lang.reflect.java.IJavaType
uses java.lang.*
uses javax.swing.*
uses javax.swing.table.AbstractTableModel
uses gw.lang.reflect.java.JavaTypes

/**
 */
class BlameTableModel extends AbstractTableModel {
  var _lines = new String[0]
  var _changes = new IP4ChangeInfo[0]

  function reset(lines : String[], changes : IP4ChangeInfo[]) {
    _lines = lines;
    _changes = changes
  }

  override property get RowCount() : int {
    return _lines.length;
  }

  override property get ColumnCount() : int {
    return 5;
  }

  override function getColumnName(columnIndex : int) : String {
    switch (columnIndex) {
    case 0:
      return "User";
    case 1:
      return "Date";
    case 2:
      return "Change";
    case 3:
      return "Line";
    case 4:
      return "";
    default:
      return null;
    }
  }

  override function getColumnClass(columnIndex : int) : Class<?> {
    switch (columnIndex) {
    case 0:
      return JavaTypes.STRING().BackingClass
    case 1:
      return JavaTypes.STRING().BackingClass
    case 2:
      return JavaTypes.INTEGER().BackingClass
    case 3:
      return JavaTypes.INTEGER().BackingClass
    case 4:
      return JavaTypes.STRING().BackingClass
    default:
      return null;
    }
  }

  override function getValueAt(row : int, col : int) : Object {
    var change = _changes[row]
    switch (col) {
    case 0:
      return change == null ? null : change.getUser();
    case 1:
      return change == null ? null : change.getDate();
    case 2:
      return change == null ? null : change.getChange() as String
    case 3:
      return Integer.toString(row)
    case 4:
      return _lines[row];
    default:
      return null;
    }
  }
}
