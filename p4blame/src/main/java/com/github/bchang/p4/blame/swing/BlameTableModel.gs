package com.github.bchang.p4.blame.swing;

uses com.github.bchang.p4.blame.IP4ChangeInfo

uses gw.lang.reflect.java.IJavaType
uses java.lang.*
uses javax.swing.*
uses javax.swing.table.AbstractTableModel

/**
 */
class BlameTableModel extends AbstractTableModel {
  var _lines = new String[0]
  var _changes : IP4ChangeInfo[]

  function setLines(lines : String[]) {
    _lines = lines;
    _changes = new IP4ChangeInfo[lines.length];
  }

  function setChangeInfo(idx : int, change : IP4ChangeInfo) {
    _changes[idx] = change;
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
      return IJavaType.STRING.IntrinsicClass
    case 1:
      return IJavaType.STRING.IntrinsicClass
    case 2:
      return IJavaType.INTEGER.IntrinsicClass
    case 3:
      return IJavaType.INTEGER.IntrinsicClass
    case 4:
      return IJavaType.STRING.IntrinsicClass
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

  function maybeShowChangeInfo(table : JTable, row : int, col : int) {
    if (0 <= col && col <=2) {
      var change = _changes[row]
      if (change != null) {
        table.ToolTipText = toHTML("Change " + change.Change +
                " by " + change.User + " on " + change.Date + "\n" +
                change.Path + "\n\n" +
                change.Description)
      }
    } else {
      table.ToolTipText = null
    }
  }

  private function toHTML(s : String) : String {
    var sb = new StringBuilder()
    sb.append("<html>");
    for (c in s.toCharArray()) {
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
