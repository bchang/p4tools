package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4ChangeInfo;

import javax.swing.*;
import javax.swing.table.AbstractTableModel;

/**
 */
class BlameTableModel extends AbstractTableModel {
  String[] _lines = new String[0];
  private IP4ChangeInfo[] _changes;

  void setLines(String[] lines) {
    _lines = lines;
    _changes = new IP4ChangeInfo[lines.length];
  }

  void setChangeInfo(int idx, IP4ChangeInfo change) {
    _changes[idx] = change;
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

  public Object getValueAt(int row, int col) {
    IP4ChangeInfo change = _changes[row];
    switch (col) {
    case 0:
      return change == null ? null : change.getUser();
    case 1:
      return change == null ? null : change.getDate();
    case 2:
      return change == null ? null : change.getChange();
    case 3:
      return row;
    case 4:
      return _lines[row];
    default:
      return null;
    }
  }

  public void maybeShowChangeInfo(JTable table, int row, int col) {
    if (0 <= col && col <=2) {
      IP4ChangeInfo change = _changes[row];
      if (change != null) {
        table.setToolTipText(toHTML("Change " + change.getChange() +
                " by " + change.getUser() + " on " + change.getDate() + "\n\n" +
                change.getDescription()
        ));
      }
    } else {
      table.setToolTipText(null);
    }
  }

  private String toHTML(String s) {
    StringBuilder sb = new StringBuilder();
    sb.append("<html>");
    for (char c : s.toCharArray()) {
      switch (c) {
      case '>':
        sb.append("&gt;");
        break;
      case '<':
        sb.append("&lt;");
        break;
      case '"':
        sb.append("&quot;");
        break;
      case '&':
        sb.append("&amp;");
        break;
      case '\n':
        sb.append("<br/>");
        break;
      default:
        sb.append(c);
      }
    }
    sb.append("<html>");
    return sb.toString();
  }
}
