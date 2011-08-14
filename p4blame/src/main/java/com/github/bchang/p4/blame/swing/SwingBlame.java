package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4Blame;
import com.github.bchang.p4.blame.IP4BlameLine;
import com.github.bchang.p4.blame.IP4BlameListener;

import javax.swing.*;
import javax.swing.table.TableCellRenderer;
import java.awt.*;
import java.awt.event.*;

/**
 */
@SuppressWarnings({"UnusedDeclaration"})
public class SwingBlame extends JFrame implements IP4BlameListener, ActionListener {

  private final Object _lock = new Object();
  private final IP4Blame _blame;

  private JTextField _pathField;
  private JButton _goButton;

  private BlameTableModel _model;
  private BlameScrollBarUI _scrollBarUI;

  private JLabel _status;

  private int _numDiscovered;

  public SwingBlame(IP4Blame blame, String path) {
    super();
    _blame = blame;
    _blame.addListener(this);
    this.addWindowListener(new WindowAdapter() {
      @Override
      public void windowClosing(WindowEvent e) {
        System.exit(0);
      }
    });

    this.setSize(800, 600);
    this.setLayout(new BorderLayout());

    JPanel topPanel = new JPanel();
    topPanel.setLayout(new BorderLayout());
    _pathField = new JTextField(path);
    _pathField.addActionListener(this);
    topPanel.add(_pathField, BorderLayout.CENTER);
    _goButton = new JButton("Go");
    _goButton.addActionListener(this);
    topPanel.add(_goButton, BorderLayout.EAST);
    this.add(topPanel, BorderLayout.NORTH);

    _model = new BlameTableModel();
    final JTable table = new JTable(_model);
    table.addMouseMotionListener(new MouseMotionAdapter() {
      @Override
      public void mouseMoved(MouseEvent e) {
        Point p = e.getPoint();
        int row = table.rowAtPoint(p);
        int col = table.columnAtPoint(p);
        _model.maybeShowChangeInfo(table, row, col);
      }
    });
    table.setAutoResizeMode(JTable.AUTO_RESIZE_LAST_COLUMN);
    table.getColumnModel().getColumn(0).setMaxWidth(100);
    table.getColumnModel().getColumn(1).setMaxWidth(100);
    table.getColumnModel().getColumn(2).setMaxWidth(100);
    table.getColumnModel().getColumn(3).setMaxWidth(40);
    JScrollPane scrollPane = new JScrollPane(table, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
    JScrollBar scrollBar = new JScrollBar();
    _scrollBarUI = new BlameScrollBarUI();
    scrollBar.setUI(_scrollBarUI);
    scrollPane.setVerticalScrollBar(scrollBar);
    this.add(scrollPane, BorderLayout.CENTER);

    _status = new JLabel();
    _status.setVisible(false);
    this.add(_status, BorderLayout.SOUTH);
  }

  public void status(final String status) {
    EventQueue.invokeLater(new Runnable() {
      public void run() {
        _status.setText(status);
      }
    });
  }

  public void lineDiscovered(final IP4BlameLine line) {
    EventQueue.invokeLater(new Runnable() {
      public void run() {
        _scrollBarUI.setLineFound(line.getId());
        _model.setChangeInfo(line.getId(), line.getChangeInfo());
        _model.fireTableRowsUpdated(line.getId(), line.getId());
        SwingBlame.this.repaint();
      }
    });
    synchronized(_lock) {
      if (++_numDiscovered == _model.getRowCount()) {
        EventQueue.invokeLater(new Runnable() {
          public void run() {
            blameFinished();
          }
        });
      }
    }
  }

  public void actionPerformed(ActionEvent evt) {
    if (evt.getSource() == _pathField || evt.getSource() == _goButton) {
      try {
        synchronized(_lock) {
          _numDiscovered = 0;
        }
        blameStarted();
        String[] lines = _blame.setup(_pathField.getText());
        _scrollBarUI.setLines(lines);
        _model.setLines(lines);
        _model.fireTableDataChanged();
        SwingBlame.this.repaint();
        Thread blameThread = new Thread(new Runnable() {
          public void run() {
            long startTime = System.nanoTime();
            _blame.start();
            long runningTime = System.nanoTime() - startTime;
            System.out.println("blame ran in " + (runningTime / 1000 / 1000) + " ms");
          }
        });
        blameThread.start();
      } catch (IllegalArgumentException ex) {
        JOptionPane.showMessageDialog(this, ex.getMessage());
      }
    }
  }

  private void blameStarted() {
    _pathField.setEnabled(false);
    _goButton.setEnabled(false);
    _status.setVisible(true);
  }

  private void blameFinished() {
    _pathField.setEnabled(true);
    _goButton.setEnabled(true);
    _status.setVisible(false);
  }

}
