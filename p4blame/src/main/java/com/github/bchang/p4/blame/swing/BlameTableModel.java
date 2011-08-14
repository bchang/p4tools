package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4BlameLine;

import javax.swing.table.AbstractTableModel;

/**
 */
class BlameTableModel extends AbstractTableModel {
  Integer[] _changes;
  String[] _users;
  String[] _dates;
  String[] _lines = new String[0];

  void setLines(String[] lines) {
    _lines = lines;
    _changes = new Integer[lines.length];
    _users = new String[lines.length];
    _dates = new String[lines.length];
  }

  public int getRowCount() {
    return _lines.length;
  }

  public int getColumnCount() {
    return 5;
  }

  public String getColumnName(int columnIndex) {
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

  public Class<?> getColumnClass(int columnIndex) {
    switch (columnIndex) {
    case 0:
      return String.class;
    case 1:
      return String.class;
    case 2:
      return Integer.class;
    case 3:
      return Integer.class;
    case 4:
      return String.class;
    default:
      return null;
    }
  }

  public Object getValueAt(int rowIndex, int columnIndex) {
    switch (columnIndex) {
    case 0:
      return _users[rowIndex];
    case 1:
      return _dates[rowIndex];
    case 2:
      return _changes[rowIndex];
    case 3:
      return rowIndex;
    case 4:
      return _lines[rowIndex];
    default:
      return null;
    }
  }
}
