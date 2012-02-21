var p4 = com.github.bchang.p4.base.P4Factory.createP4()
var blame = new com.github.bchang.p4.blame.P4Blame(p4)
var swing = new com.github.bchang.p4.blame.swing.SwingBlame(blame, null)
swing.Visible = true
