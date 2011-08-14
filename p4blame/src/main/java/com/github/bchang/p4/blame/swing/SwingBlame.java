package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4Blame;
import com.github.bchang.p4.blame.IP4BlameLine;
import com.github.bchang.p4.blame.IP4BlameListener;

import javax.swing.*;
import javax.swing.table.AbstractTableModel;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

/**
 */
public class SwingBlame extends JFrame implements IP4BlameListener, ActionListener {

  private final IP4Blame _blame;
  private BlameTableModel _lines;
  private JTextField _pathField;
  private JTable _table;
  private Thread _blameThread;

  public SwingBlame(IP4Blame blame) {
    super();
    _blame = blame;
    _blame.addListener(this);
  }

  public void go() {
    this.setSize(800, 600);
    this.setLayout(new BorderLayout());
    _pathField = new JTextField("");
    this.add(_pathField, BorderLayout.NORTH);
    _pathField.addActionListener(this);
    _lines = new BlameTableModel();
    _table = new JTable(_lines);
    this.add(_table, BorderLayout.CENTER);
    this.setVisible(true);
  }

  public void lineDiscovered(final IP4BlameLine line) {
    EventQueue.invokeLater(new Runnable() {
      public void run() {
        _lines._changes[line.getId()] = line.getChange();
        _lines.fireTableRowsUpdated(line.getId(), line.getId());
        _table.repaint();
      }
    });
  }

  public void actionPerformed(ActionEvent e) {
    if (e.getSource() == _pathField) {
      _lines.setLines(_blame.forPathNoStart(_pathField.getText()));
      _lines.fireTableDataChanged();
      _table.repaint();
      _blameThread = new Thread(new Runnable() {
        public void run() {
          long startTime = System.nanoTime();
          _blame.start();
          long runningTime = System.nanoTime() - startTime;
          System.out.println("blame ran in " + (runningTime / 1000 / 1000) + " ms");
        }
      });
      _blameThread.start();
    }
  }

  class BlameTableModel extends AbstractTableModel {
    Integer[] _changes;
    String[] _lines = new String[0];

    void setLines(IP4BlameLine[] lines) {
      _lines = new String[lines.length];
      for (int i = 0; i < lines.length; i++) {
        _lines[i] = lines[i].getLine();
      }
      _changes = new Integer[lines.length];
    }

    public int getRowCount() {
      return _lines.length;
    }

    public int getColumnCount() {
      return 3;
    }

    public String getColumnName(int columnIndex) {
      switch (columnIndex) {
      case 0:
        return "Change";
      case 1:
        return "Line";
      case 2:
        return "";
      default:
        return null;
      }
    }

    public Class<?> getColumnClass(int columnIndex) {
      switch (columnIndex) {
      case 0:
        return Integer.class;
      case 1:
        return Integer.class;
      case 2:
        return String.class;
      default:
        return null;
      }
    }

    public Object getValueAt(int rowIndex, int columnIndex) {
      switch (columnIndex) {
      case 0:
        return _changes[rowIndex];
      case 1:
        return rowIndex;
      case 2:
        return _lines[rowIndex];
      default:
        return null;
      }
    }
  }
}
