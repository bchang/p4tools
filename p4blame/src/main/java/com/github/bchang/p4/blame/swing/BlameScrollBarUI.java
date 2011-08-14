package com.github.bchang.p4.blame.swing;

import com.github.bchang.p4.blame.IP4BlameLine;

import javax.swing.*;
import javax.swing.plaf.metal.MetalScrollBarUI;
import java.awt.*;

/**
 */
class BlameScrollBarUI extends MetalScrollBarUI {
  public static final Color COLOR_BLOCK_HIGHLIGHT = new Color(114, 153, 191);
  public static final Color COLOR_BLOCK = new Color(153, 204, 255);
  public static final Color COLOR_BLOCK_SHADOW = new Color(218, 255, 255);

  private boolean[] _lines = new boolean[0];

  void setLines(IP4BlameLine[] lines) {
    _lines = new boolean[lines.length];
  }

  void setLineFound(int idx) {
    _lines[idx] = true;
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

