const db = require('./config/db');

async function check() {
  try {
    let queryStr = `
      SELECT po.*, q.price, v.company_name, v.category, r.title as rfq_title, r.quantity
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      LEFT JOIN users u ON po.created_by = u.id
    `;
    const [orders] = await db.query(queryStr);
    console.log(orders);
  } catch(e) {
    console.error("ERROR", e);
  }
  process.exit();
}
check();
