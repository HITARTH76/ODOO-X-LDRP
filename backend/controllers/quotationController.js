const db = require('../config/db');

// Submit Quotation (Vendor only)
exports.submitQuotation = async (req, res) => {
  const { rfqId, price, deliveryDays, remarks } = req.body;

  if (!rfqId || !price || !deliveryDays) {
    return res.status(400).json({ message: 'RFQ ID, price, and delivery timeline are required' });
  }

  try {
    // Get vendor profile
    const [vendors] = await db.query('SELECT id, company_name FROM vendors WHERE user_id = ?', [req.user.id]);
    if (vendors.length === 0) {
      return res.status(403).json({ message: 'Account is not associated with an active vendor profile' });
    }
    const vendorId = vendors[0].id;
    const vendorName = vendors[0].company_name;

    // Check if RFQ exists and is active
    const [rfqs] = await db.query('SELECT * FROM rfqs WHERE id = ?', [rfqId]);
    if (rfqs.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }
    const rfq = rfqs[0];

    if (rfq.status !== 'Active') {
      return res.status(400).json({ message: `Cannot submit quotation. RFQ is currently ${rfq.status}` });
    }

    // Check if deadline has passed
    if (new Date(rfq.deadline) < new Date().setHours(0,0,0,0)) {
      return res.status(400).json({ message: 'The submission deadline for this RFQ has expired' });
    }

    // Open Bidding: Removed the restriction that requires explicit assignment


    // Check if already submitted (if so, we overwrite or update)
    const [existingQuote] = await db.query('SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ?', [rfqId, vendorId]);
    
    if (existingQuote.length > 0) {
      // Update existing
      await db.query(
        'UPDATE quotations SET price = ?, delivery_days = ?, remarks = ?, status = ? WHERE id = ?',
        [parseFloat(price), parseInt(deliveryDays), remarks || '', 'Submitted', existingQuote[0].id]
      );
      
      // Log audit
      await db.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.id, 'Quotation Updated', `${vendorName} updated quotation for RFQ #${rfqId}`]
      );
      
      return res.json({ message: 'Quotation updated successfully', quotationId: existingQuote[0].id });
    }

    // Insert new Quotation
    const [quoteResult] = await db.query(
      'INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, remarks, status) VALUES (?, ?, ?, ?, ?, ?)',
      [rfqId, vendorId, parseFloat(price), parseInt(deliveryDays), remarks || '', 'Submitted']
    );

    const quotationId = quoteResult.insertId;

    // Send notification to the Procurement Officer who created the RFQ
    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [rfq.created_by, `New Quotation submitted for RFQ: "${rfq.title}" by ${vendorName}`]
    );

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Quotation Submitted', `${vendorName} submitted quote for RFQ #${rfqId} (${price} USD)`]
    );

    res.status(201).json({ message: 'Quotation submitted successfully', quotationId });
  } catch (err) {
    console.error('Error submitting quotation:', err.message);
    res.status(500).json({ message: 'Server error submitting quotation' });
  }
};

// Get Quotations by RFQ (Officer / Manager / Admin)
exports.getQuotationsByRfq = async (req, res) => {
  const rfqId = req.params.rfqId;

  try {
    const [quotations] = await db.query(
      'SELECT q.*, v.company_name, v.category, v.rating FROM quotations q JOIN vendors v ON q.vendor_id = v.id WHERE q.rfq_id = ?',
      [rfqId]
    );
    res.json(quotations);
  } catch (err) {
    console.error('Error fetching quotations:', err.message);
    res.status(500).json({ message: 'Server error fetching quotations' });
  }
};

// Get all Quotations submitted by current vendor
exports.getVendorQuotations = async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
    if (vendors.length === 0) {
      return res.json([]);
    }
    const vendorId = vendors[0].id;

    const [quotations] = await db.query(
      'SELECT q.*, r.title as rfq_title, r.quantity, r.status as rfq_status FROM quotations q JOIN rfqs r ON q.rfq_id = r.id WHERE q.vendor_id = ?',
      [vendorId]
    );
    res.json(quotations);
  } catch (err) {
    console.error('Error fetching vendor quotations:', err.message);
    res.status(500).json({ message: 'Server error fetching quotations' });
  }
};

// Get all Quotations (Admin / Officer / Manager)
exports.getAllQuotations = async (req, res) => {
  try {
    const [quotations] = await db.query(
      'SELECT q.*, v.company_name, v.category, v.rating, r.title as rfq_title FROM quotations q JOIN vendors v ON q.vendor_id = v.id JOIN rfqs r ON q.rfq_id = r.id'
    );
    res.json(quotations);
  } catch (err) {
    console.error('Error fetching all quotations:', err.message);
    res.status(500).json({ message: 'Server error fetching all quotations' });
  }
};
