const db = require('./config/db');

async function testQuotation() {
  try {
    const rfqId = 4;
    const vendorId = 4; // adil
    const price = "50000";
    const deliveryDays = "15";
    const remarks = "Test remark";
    
    // Get vendor name
    const [vendors] = await db.query('SELECT company_name FROM vendors WHERE id = ?', [vendorId]);
    const vendorName = vendors[0].company_name;

    // Check rfq
    const [rfqs] = await db.query('SELECT * FROM rfqs WHERE id = ?', [rfqId]);
    const rfq = rfqs[0];

    console.log("RFQ:", rfq);
    
    // Verify vendor assigned
    const [assignment] = await db.query('SELECT * FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?', [rfqId, vendorId]);
    console.log("Assignment:", assignment);

    // Insert
    const [quoteResult] = await db.query(
      'INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, remarks, status) VALUES (?, ?, ?, ?, ?, ?)',
      [rfqId, vendorId, parseFloat(price), parseInt(deliveryDays), remarks || '', 'Submitted']
    );
    console.log("Quote inserted:", quoteResult.insertId);

    // Notification
    const [notifResult] = await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [rfq.created_by, `New Quotation submitted for RFQ: "${rfq.title}" by ${vendorName}`]
    );
    console.log("Notif inserted:", notifResult.insertId);

    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  }
}

testQuotation();
