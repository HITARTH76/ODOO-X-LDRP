const db = require('../config/db');

// Create RFQ (Procurement Officer / Admin)
exports.createRfq = async (req, res) => {
  const { title, description, deadline, vendorIds, category, lineItems, attachments, status } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required fields' });
  }

  const finalStatus = status === 'Draft' ? 'Draft' : 'Active';
  const qtyTotal = (lineItems && Array.isArray(lineItems)) ? lineItems.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0) : 0;
  
  const lineItemsJson = lineItems ? JSON.stringify(lineItems) : null;
  const attachmentsJson = attachments ? JSON.stringify(attachments) : null;

  try {
    // Insert RFQ
    const [rfqResult] = await db.query(
      'INSERT INTO rfqs (title, description, quantity, deadline, created_by, status, category, line_items, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', qtyTotal, deadline, req.user.id, finalStatus, category || null, lineItemsJson, attachmentsJson]
    );

    const rfqId = rfqResult.insertId;

    // Assign Vendors if any
    if (vendorIds && Array.isArray(vendorIds)) {
      for (const vendorId of vendorIds) {
        await db.query('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)', [rfqId, parseInt(vendorId)]);
        
        // Notify vendor user ONLY IF ACTIVE
        if (finalStatus === 'Active') {
          const [vendorUser] = await db.query('SELECT user_id FROM vendors WHERE id = ?', [vendorId]);
          if (vendorUser.length > 0 && vendorUser[0].user_id) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
              vendorUser[0].user_id,
              `You have been invited to submit a quote for RFQ: "${title}"`
            ]);
          }
        }
      }
    }

    // Log the audit trail
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'RFQ Created', `RFQ #${rfqId} "${title}" created as ${finalStatus} with ${vendorIds ? vendorIds.length : 0} assigned vendors.`]
    );

    res.status(201).json({ message: `RFQ ${finalStatus === 'Draft' ? 'saved as Draft' : 'created and dispatched'} successfully`, rfqId });
  } catch (err) {
    console.error('Error creating RFQ:', err.message);
    res.status(500).json({ message: 'Server error creating RFQ' });
  }
};

// Get all RFQs (with filtering based on user role)
exports.getAllRfqs = async (req, res) => {
  try {
    let queryStr = 'SELECT r.*, u.name as creator_name FROM rfqs r LEFT JOIN users u ON r.created_by = u.id';
    let params = [];

    // If Vendor role, get ALL active RFQs to bid on, rather than only assigned ones
    if (req.user.role === 'Vendor') {
      queryStr = 'SELECT r.*, u.name as creator_name FROM rfqs r LEFT JOIN users u ON r.created_by = u.id WHERE r.status = "Active"';
    }

    const [rfqs] = await db.query(queryStr, params);
    res.json(rfqs);
  } catch (err) {
    console.error('Error fetching RFQs:', err.message);
    res.status(500).json({ message: 'Server error fetching RFQs' });
  }
};

// Get RFQ by ID (including list of assigned vendors and quotations if appropriate)
exports.getRfqById = async (req, res) => {
  const rfqId = req.params.id;

  try {
    // Get RFQ Details
    const [rfqs] = await db.query(
      'SELECT r.*, u.name as creator_name FROM rfqs r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
      [rfqId]
    );

    if (rfqs.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const rfq = rfqs[0];

    // Check vendor eligibility
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0) {
        return res.status(403).json({ message: 'No vendor profile associated with this account' });
      }
      
      // Instead of blocking if not assigned, just ensure the RFQ is Active (public for bidding)
      if (rfq.status !== 'Active') {
        // Only assigned vendors can see inactive ones (if we wanted to be strict), but let's just block inactive.
        const vendorId = vendors[0].id;
        const [assignment] = await db.query('SELECT * FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?', [rfqId, vendorId]);
        if (assignment.length === 0) {
          return res.status(403).json({ message: 'Access denied: This RFQ is no longer active for public bidding.' });
        }
      }
    }

    // Get Assigned Vendors
    const [assignedVendors] = await db.query(
      'SELECT v.*, u.email as contact_email FROM vendors v JOIN rfq_vendors rv ON v.id = rv.vendor_id LEFT JOIN users u ON v.user_id = u.id WHERE rv.rfq_id = ?',
      [rfqId]
    );
    rfq.assignedVendors = assignedVendors;

    // Get quotations if officer, manager, or admin (Vendors cannot see others' quotes!)
    if (['Procurement Officer', 'Manager', 'Admin'].includes(req.user.role)) {
      const [quotations] = await db.query(
        'SELECT q.*, v.company_name, v.rating FROM quotations q JOIN vendors v ON q.vendor_id = v.id WHERE q.rfq_id = ?',
        [rfqId]
      );
      rfq.quotations = quotations;
    } else {
      // Vendor can only see their own quotation for this RFQ, if submitted
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length > 0) {
        const vendorId = vendors[0].id;
        const [quotations] = await db.query(
          'SELECT q.*, v.company_name, v.rating FROM quotations q JOIN vendors v ON q.vendor_id = v.id WHERE q.rfq_id = ? AND q.vendor_id = ?',
          [rfqId, vendorId]
        );
        rfq.myQuotation = quotations.length > 0 ? quotations[0] : null;
      }
    }

    res.json(rfq);
  } catch (err) {
    console.error('Error fetching RFQ details:', err.message);
    res.status(500).json({ message: 'Server error fetching RFQ details' });
  }
};
// Delete RFQ (Admin only)
exports.deleteRfq = async (req, res) => {
  const rfqId = req.params.id;

  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only administrators can delete RFQs.' });
    }

    const [rfqResult] = await db.query('SELECT * FROM rfqs WHERE id = ?', [rfqId]);
    if (rfqResult.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    // Cascade delete manually if foreign keys aren't set to ON DELETE CASCADE
    await db.query('DELETE FROM rfq_vendors WHERE rfq_id = ?', [rfqId]);
    await db.query('DELETE FROM quotations WHERE rfq_id = ?', [rfqId]);
    await db.query('DELETE FROM rfqs WHERE id = ?', [rfqId]);

    // Log the audit trail
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'RFQ Deleted', `RFQ #${rfqId} "${rfqResult[0].title}" was permanently deleted.`]
    );

    res.json({ message: 'RFQ deleted successfully' });
  } catch (err) {
    console.error('Error deleting RFQ:', err.message);
    res.status(500).json({ message: 'Server error deleting RFQ' });
  }
};
