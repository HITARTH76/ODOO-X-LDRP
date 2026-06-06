const db = require('./config/db');

async function testReports() {
  try {
    const [trendRows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b') as month, SUM(total_amount) as amount
      FROM invoices
      WHERE status = 'Paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `);
    console.log('Trend Rows:', trendRows);

    const [categoryRows] = await db.query(`
      SELECT v.category, SUM(inv.total_amount) as amount
      FROM invoices inv
      JOIN purchase_orders po ON inv.purchase_order_id = po.id
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      WHERE inv.status = 'Paid'
      GROUP BY v.category
    `);
    console.log('Category Rows:', categoryRows);

    const [vendorRows] = await db.query(`
      SELECT v.company_name as name, v.rating, COUNT(po.id) as count, COALESCE(SUM(inv.total_amount), 0) as total
      FROM vendors v
      LEFT JOIN quotations q ON q.vendor_id = v.id
      LEFT JOIN purchase_orders po ON po.quotation_id = q.id
      LEFT JOIN invoices inv ON inv.purchase_order_id = po.id AND inv.status = 'Paid'
      GROUP BY v.id, v.company_name, v.rating
      ORDER BY total DESC
    `);
    console.log('Vendor Rows:', vendorRows);
    
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

testReports();
