const db = require('./config/db');

async function testQuery() {
  try {
    const [quotations] = await db.query(
      'SELECT q.*, v.company_name, v.category, v.rating FROM quotations q JOIN vendors v ON q.vendor_id = v.id WHERE q.rfq_id = ?',
      [4]
    );
    console.log("Quotations for RFQ 4:", quotations);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

testQuery();
