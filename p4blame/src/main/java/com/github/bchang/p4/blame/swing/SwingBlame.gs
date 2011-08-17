package com.github.bchang.p4.blame.swing;

uses com.github.bchang.p4.blame.IP4Blame
uses com.github.bchang.p4.blame.IP4BlameLine
uses com.github.bchang.p4.blame.IP4BlameListener
uses com.github.bchang.p4.blame.IP4ChangeInfo
uses gw.lang.reflect.TypeSystem
uses javax.swing.*
uses java.awt.*
uses java.awt.event.*
uses java.io.File
uses java.lang.*
uses java.util.concurrent.locks.ReentrantLock

/**
 */
class SwingBlame extends JFrame implements IP4BlameListener, ActionListener {

  var _lock = new ReentrantLock()
  var _blame : IP4Blame

  var _lines = new String[0]
  var _changes = new IP4ChangeInfo[0]

  var _pathField : JTextField
  var _chooserButton : JButton
  var _blameButton : JButton

  var _model : BlameTableModel
  var _scrollBarUI : BlameScrollBarUI

  var _status : JLabel

  var _numDiscovered : int

  // TODO - figure these out
  var _me : SwingBlame
  static var BORDERLAYOUT_CENTER = "Center"
  static var BORDERLAYOUT_EAST = "East"
  static var BORDERLAYOUT_SOUTH = "South"
  static var BORDERLAYOUT_WEST = "West"
  static var BORDERLAYOUT_NORTH = "North"

  construct(blame : IP4Blame, path : String) {
    super("p4blame");
    _me = this
    _blame = blame;
    _blame.addListener(this);
    this.addWindowListener(new WindowAdapter() {
      override function windowClosing(e : WindowEvent) {
        System.exit(0);
      }
    });

    this.setSize(800, 600);
    this.Layout = new BorderLayout()

    var topPanel = new JPanel()
    topPanel.Layout = new BorderLayout()
    _pathField = new JTextField(path != null ? path : "")
    _pathField.ToolTipText = "Enter a depot or file system path here"
    _pathField.addActionListener(this);
    topPanel.add(_pathField, BORDERLAYOUT_CENTER);
    _chooserButton = new JButton(new ImageIcon(TypeSystem.getResource("com/github/bchang/p4/blame/swing/Open16.gif")))
    _chooserButton.ToolTipText = "Find a local file"
    _chooserButton.addActionListener(this)
    topPanel.add(_chooserButton, BORDERLAYOUT_WEST)
    _blameButton = new JButton(new ImageIcon(TypeSystem.getResource("com/github/bchang/p4/blame/swing/Play16.gif")))
    _blameButton.ToolTipText = "blame!"
    _blameButton.addActionListener(this)
    topPanel.add(_blameButton, BORDERLAYOUT_EAST)
    this.add(topPanel, BORDERLAYOUT_NORTH);

    _model = new BlameTableModel();
    var table = new JTable(_model)
    table.addMouseMotionListener(new MouseMotionAdapter() {
      override function mouseMoved(e : MouseEvent) {
        var p = e.getPoint()
        var row = table.rowAtPoint(p)
        var col = table.columnAtPoint(p)
        maybeShowChangeInfo(table, row, col)
      }
    });
    table.setAutoResizeMode(JTable.AUTO_RESIZE_LAST_COLUMN);
    table.getColumnModel().getColumn(0).setMaxWidth(100);
    table.getColumnModel().getColumn(1).setMaxWidth(100);
    table.getColumnModel().getColumn(2).setMaxWidth(100);
    table.getColumnModel().getColumn(3).setMaxWidth(40);
    var scrollPane = new JScrollPane(table, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED)
    var scrollBar = new JScrollBar()
    _scrollBarUI = new BlameScrollBarUI();
    scrollBar.setUI(_scrollBarUI);
    scrollPane.setVerticalScrollBar(scrollBar);
    this.add(scrollPane, BORDERLAYOUT_CENTER);

    _status = new JLabel();
    _status.Visible = false
    this.add(_status, BORDERLAYOUT_SOUTH);

    if (path != null) {
      EventQueue.invokeLater(new Runnable() {
        override function run() {
          startBlame()
        }
      })
    }
  }

  override function status(status : String) {
    EventQueue.invokeLater(new Runnable() {
      override function run() {
        _status.Text = status
      }
    });
  }

  override function lineDiscovered(line : IP4BlameLine) {
    EventQueue.invokeLater(new Runnable() {
      override function run() {
        _changes[line.getId()] = line.ChangeInfo
        _model.fireTableRowsUpdated(line.getId(), line.getId());
        _me.repaint();
      }
    });
    using(_lock) {
      _numDiscovered++
      if (_numDiscovered == _model.getRowCount()) {
        EventQueue.invokeLater(new Runnable() {
          override function run() {
            blameFinished();
          }
        });
      }
    }
  }

  override function actionPerformed(evt : ActionEvent) {
    if (evt.Source == _pathField || evt.Source == _blameButton) {
      startBlame()
    }
    else if (evt.Source == _chooserButton) {
      var chooser = new JFileChooser()
      if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
        _pathField.Text = chooser.SelectedFile.Path
        startBlame()
      }
    }
  }

  private function startBlame() {
    _pathField.Enabled = false
    _chooserButton.Enabled = false
    _blameButton.Enabled = false
    _status.Visible = true

    try {
      using(_lock) {
        _numDiscovered = 0;
      }
      _lines = _blame.setup(_pathField.getText())
      _changes = new IP4ChangeInfo[_lines.length]

      _scrollBarUI.reset(_changes)
      _model.reset(_lines, _changes)

      _model.fireTableDataChanged();
      _me.repaint();
      var blameThread = new Thread(new Runnable() {
        override function run() {
          var startTime = System.nanoTime()
          _blame.start();
          var runningTime = System.nanoTime() - startTime
          print("blame ran in " + (runningTime / 1000 / 1000) + " ms")
        }
      });
      blameThread.start();
    } catch (ex : Exception) {
      JOptionPane.showMessageDialog(this, ex.Message)
      blameFinished()
    }
  }

  private function blameFinished() {
    _pathField.Enabled = true
    _chooserButton.Enabled = true
    _blameButton.Enabled = true
    _status.Visible = false
  }

  private function maybeShowChangeInfo(table : JTable, row : int, col : int) {
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
