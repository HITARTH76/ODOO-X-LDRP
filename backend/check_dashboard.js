const db = require('./config/db');

async function check() {
  try {
    const [[{ count: activeRfqs }]] = await db.query("SELECT COUNT(*) as count FROM rfqs WHERE status = 'Active'");
    const [[{ count: pendingApprovals }]] = await db.query("SELECT COUNT(*) as count FROM quotations WHERE status = 'Submitted'");
    const [[{ count: totalPos }]] = await db.query("SELECT COUNT(*) as count FROM purchase_orders");
    const [[{ count: totalInvs }]] = await db.query("SELECT COUNT(*) as count FROM invoices");
    const [[{ sum: totalSpend }]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as sum FROM invoices WHERE status = 'Paid'");
    console.log({ activeRfqs, pendingApprovals, totalPos, totalInvs, totalSpend: parseFloat(totalSpend) });
  } catch(e) {
    console.error("ERROR", e);
  }
  process.exit();
}
check();
