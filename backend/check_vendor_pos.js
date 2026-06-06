const db = require('./config/db');

async function check() {
  const [vendors] = await db.query('SELECT * FROM vendors WHERE user_id = 3'); // id=3 is Vendor adil patel
  console.log("VENDOR:", vendors);
  if (vendors.length > 0) {
    const [quotes] = await db.query('SELECT * FROM quotations WHERE vendor_id = ?', [vendors[0].id]);
    console.log("QUOTES:", quotes);
    const [pos] = await db.query('SELECT po.* FROM purchase_orders po JOIN quotations q ON po.quotation_id = q.id WHERE q.vendor_id = ?', [vendors[0].id]);
    console.log("POs:", pos);
  }
  process.exit(0);
}
check();
