package com.github.bchang.p4.blame.swing;

uses com.github.bchang.p4.base.IP4BlameLine
uses com.github.bchang.p4.base.IP4ChangeInfo

uses javax.swing.*
uses javax.swing.plaf.metal.MetalScrollBarUI
uses java.awt.*

/**
 */
class BlameScrollBarUI extends MetalScrollBarUI {
  static var COLOR_BLOCK_HIGHLIGHT = new Color(114, 153, 191)
  static var COLOR_BLOCK = new Color(153, 204, 255)
  static var COLOR_BLOCK_SHADOW = new Color(218, 255, 255)

  var _changes = new IP4ChangeInfo[0]

  function reset(changes : IP4ChangeInfo[]) {
    _changes = changes
  }

  override function paintTrack(g : Graphics, c : JComponent, bounds : Rectangle) {
    super.paintTrack(g, c, bounds);

    var blockStart = -1
    var blockEnd = -1
    for (change in _changes index i) {
      if (change != null) {
        if (blockStart < 0) {
          blockStart = i;
        }
        blockEnd = i;
      }
      else {
        if (blockStart >= 0) {
          paintBlock(g, bounds, blockStart, blockEnd);
          blockStart = -1;
        }
      }
    }
    if (blockStart >= 0) {
      paintBlock(g, bounds, blockStart, blockEnd);
    }
  }

  private function paintBlock(g : Graphics, bounds : Rectangle, start : int, end : int) {
    var x = bounds.X as int + 2
    var y = (bounds.Height * start / _changes.length + bounds.Y) as int
    var width = 5
    var height = (bounds.Height * (end - start) / _changes.length) as int
    g.setColor(COLOR_BLOCK_HIGHLIGHT);
    g.fillRect(x, y, width, height);
    g.setColor(COLOR_BLOCK);
    g.fillRect(x, y, width - 1, height - 1);
    g.setColor(COLOR_BLOCK_SHADOW);
    g.drawLine(x, y, x + width - 1, y);
    g.drawLine(x, y, x, y + height);
  }
}

