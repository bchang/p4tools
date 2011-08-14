package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4Blame;
import com.github.bchang.p4.blame.IP4BlameLine;
import com.github.bchang.p4.blame.IP4BlameListener;

import javax.swing.*;
import javax.swing.plaf.metal.MetalScrollBarUI;
import javax.swing.table.AbstractTableModel;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 */
public class SwingBlame extends JFrame implements IP4BlameListener, ActionListener {

  private final Object _lock = new Object();
  public static final Color COLOR_BLOCK_HIGHLIGHT = new Color(114, 153, 191);
  public static final Color COLOR_BLOCK = new Color(153, 204, 255);
  public static final Color COLOR_BLOCK_SHADOW = new Color(218, 255, 255);
  private final IP4Blame _blame;
  private BlameTableModel _lines;
  private JTextField _pathField;
  private JButton _goButton;
  private JTable _table;
  private JScrollBar _scrollBar;
  private BlameScrollBarUI _scrollBarUI;
  private JLabel _status;
  private Thread _blameThread;
  private int _numDiscovered;

  public SwingBlame(IP4Blame blame) {
    super();
    _blame = blame;
    _blame.addListener(this);
    this.addWindowListener(new WindowAdapter() {
      @Override
      public void windowClosing(WindowEvent e) {
        System.exit(0);
      }
    });
  }

  public void go(String path) {
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

    _lines = new BlameTableModel();
    _table = new JTable(_lines);
    _table.setAutoResizeMode(JTable.AUTO_RESIZE_LAST_COLUMN);
    _table.getColumnModel().getColumn(0).setMaxWidth(100);
    _table.getColumnModel().getColumn(1).setMaxWidth(100);
    _table.getColumnModel().getColumn(2).setMaxWidth(50);
    JScrollPane scrollPane = new JScrollPane(_table, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
    _scrollBar = new JScrollBar();
    _scrollBarUI = new BlameScrollBarUI();
    _scrollBar.setUI(_scrollBarUI);
    scrollPane.setVerticalScrollBar(_scrollBar);
    this.add(scrollPane, BorderLayout.CENTER);

    _status = new JLabel();
    _status.setVisible(false);
    this.add(_status, BorderLayout.SOUTH);

    this.setVisible(true);
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
        _scrollBarUI._lines[line.getId()] = true;
        _scrollBar.repaint();
        _lines._changes[line.getId()] = line.getChange();
        _lines._users[line.getId()] = line.getUser();
        _lines.fireTableRowsUpdated(line.getId(), line.getId());
        _table.repaint();
      }
    });
    synchronized(_lock) {
      if (++_numDiscovered == _lines.getRowCount()) {
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
        IP4BlameLine[] lines = _blame.forPathNoStart(_pathField.getText());
        _scrollBarUI.setLines(lines);
        _lines.setLines(lines);
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

  class BlameScrollBarUI extends MetalScrollBarUI {
    private boolean[] _lines = new boolean[0];

    void setLines(IP4BlameLine[] lines) {
      _lines = new boolean[lines.length];
    }

    @Override
    protected void paintTrack(Graphics g, JComponent c, Rectangle trackBounds) {
      super.paintTrack(g, c, trackBounds);

      int blockStart = -1;
      int blockEnd = -1;
      for (int i = 0; i < _lines.length; i++) {
        if (_lines[i]) {
          if (blockStart < 0) {
            blockStart = i;
          }
          blockEnd = i;
        }
        else {
          if (blockStart >= 0) {
            paintBlock(g, trackBounds, blockStart, blockEnd);
            blockStart = -1;
          }
        }
      }
      if (blockStart >= 0) {
        paintBlock(g, trackBounds, blockStart, blockEnd);
      }
    }

    private void paintBlock(Graphics g, Rectangle trackBounds, int start, int end) {
      int x = trackBounds.x + 2;
      int y = (int)((double)start / _lines.length * trackBounds.height) + trackBounds.y;
      int width = 5;
      int height = (int)((double)(end - start) / _lines.length * trackBounds.height);
      g.setColor(COLOR_BLOCK_HIGHLIGHT);
      g.fillRect(x, y, width, height);
      g.setColor(COLOR_BLOCK);
      g.fillRect(x, y, width - 1, height - 1);
      g.setColor(COLOR_BLOCK_SHADOW);
      g.drawLine(x, y, x + width - 1, y);
      g.drawLine(x, y, x, y + height);
    }
  }

  class BlameTableModel extends AbstractTableModel {
    Integer[] _changes;
    String[] _users;
    String[] _lines = new String[0];

    void setLines(IP4BlameLine[] lines) {
      _lines = new String[lines.length];
      for (int i = 0; i < lines.length; i++) {
        _lines[i] = lines[i].getLine();
      }
      _changes = new Integer[lines.length];
      _users = new String[lines.length];
    }

    public int getRowCount() {
      return _lines.length;
    }

    public int getColumnCount() {
      return 4;
    }

    public String getColumnName(int columnIndex) {
      switch (columnIndex) {
      case 0:
        return "Change";
      case 1:
        return "User";
      case 2:
        return "Line";
      case 3:
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
        return String.class;
      case 2:
        return Integer.class;
      case 3:
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
        return _users[rowIndex];
      case 2:
        return rowIndex;
      case 3:
        return _lines[rowIndex];
      default:
        return null;
      }
    }
  }
}
