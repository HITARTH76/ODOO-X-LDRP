const db = require('./config/db');

async function checkDb() {
  try {
    const [quotations] = await db.query('SELECT * FROM quotations');
    console.log("QUOTATIONS:", quotations);
    
    const [rfqs] = await db.query('SELECT * FROM rfqs');
    console.log("RFQS:", rfqs);
    
    const [vendors] = await db.query('SELECT * FROM vendors');
    console.log("VENDORS:", vendors);
    
    const [rfq_vendors] = await db.query('SELECT * FROM rfq_vendors');
    console.log("RFQ_VENDORS:", rfq_vendors);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
