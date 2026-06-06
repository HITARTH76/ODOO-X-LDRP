const db = require('../config/db');

// Generate Purchase Order (Procurement Officer / Admin)
exports.createPurchaseOrder = async (req, res) => {
  const { quotationId } = req.body;

  if (!quotationId) {
    return res.status(400).json({ message: 'Quotation ID is required' });
  }

  try {
    // Check if quotation exists, is approved
    const [quotations] = await db.query(
      'SELECT q.*, r.title as rfq_title, r.id as rfq_id, v.company_name, v.user_id as vendor_user_id FROM quotations q JOIN rfqs r ON q.rfq_id = r.id JOIN vendors v ON q.vendor_id = v.id WHERE q.id = ?',
      [quotationId]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const quotation = quotations[0];

    if (quotation.status !== 'Approved') {
      return res.status(400).json({ message: 'Purchase orders can only be generated for APPROVED quotations' });
    }

    // Check if PO already generated
    const [existingPo] = await db.query('SELECT id FROM purchase_orders WHERE quotation_id = ?', [quotationId]);
    if (existingPo.length > 0) {
      return res.status(400).json({ message: 'A Purchase Order has already been generated for this quotation' });
    }

    // Generate PO Number: PO-YYYYMMDD-[4 Random digits]
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${randDigits}`;

    // Create PO
    const [poResult] = await db.query(
      'INSERT INTO purchase_orders (po_number, quotation_id, created_by, status) VALUES (?, ?, ?, ?)',
      [poNumber, quotationId, req.user.id, 'Sent']
    );

    const poId = poResult.insertId;

    // Update RFQ status to Completed
    await db.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Completed', quotation.rfq_id]);

    // Notify Vendor
    if (quotation.vendor_user_id) {
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        quotation.vendor_user_id,
        `New Purchase Order Received: ${poNumber} for "${quotation.rfq_title}"`
      ]);
    }

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Purchase Order Generated', `Generated ${poNumber} from Approved quotation #${quotationId}`]
    );

    res.status(201).json({ message: 'Purchase Order generated successfully', poId, poNumber });
  } catch (err) {
    console.error('Error generating Purchase Order:', err.message);
    res.status(500).json({ message: 'Server error generating Purchase Order' });
  }
};

// Get All Purchase Orders
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    let queryStr = `
      SELECT po.*, q.price, v.company_name, v.category, r.title as rfq_title, r.quantity
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      LEFT JOIN users u ON po.created_by = u.id
    `;
    let params = [];

    // If Vendor role, only get POs sent to this vendor
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0) {
        return res.json([]);
      }
      const vendorId = vendors[0].id;
      queryStr += ' WHERE q.vendor_id = ?';
      params = [vendorId];
    }

    const [orders] = await db.query(queryStr, params);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching POs:', err.message);
    res.status(500).json({ message: 'Server error fetching Purchase Orders' });
  }
};

// Get single Purchase Order by ID
exports.getPurchaseOrderById = async (req, res) => {
  const poId = req.params.id;

  try {
    const [orders] = await db.query(
      `
      SELECT po.*, q.price, v.company_name, v.contact_phone, v.gst_number, v.address, r.title as rfq_title, r.description as rfq_desc, r.quantity
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE po.id = ?
      `,
      [poId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const order = orders[0];

    // If vendor, check access
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const vendorId = vendors[0].id;
      
      const [qCheck] = await db.query('SELECT vendor_id FROM quotations WHERE id = ?', [order.quotation_id]);
      if (qCheck.length === 0 || qCheck[0].vendor_id !== vendorId) {
        return res.status(403).json({ message: 'Access denied: You are not the vendor for this Purchase Order' });
      }
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching PO details:', err.message);
    res.status(500).json({ message: 'Server error fetching Purchase Order details' });
  }
};

// Update PO status (e.g. Vendor accepts it)
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const poId = req.params.id;

  if (!['Accepted', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [orders] = await db.query(
      'SELECT po.*, q.vendor_id, v.user_id as vendor_user_id, po.created_by as officer_id FROM purchase_orders po JOIN quotations q ON po.quotation_id = q.id JOIN vendors v ON q.vendor_id = v.id WHERE po.id = ?',
      [poId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const order = orders[0];

    // Check roles/permission: Vendor can only accept/cancel, Procurement Officer can cancel/complete
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0 || vendors[0].id !== order.vendor_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (!['Accepted', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Vendors can only set status to Accepted or Cancelled' });
      }
    }

    await db.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, poId]);

    // Send notifications
    if (req.user.role === 'Vendor') {
      // Notify procurement officer
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        order.officer_id,
        `Purchase Order ${order.po_number} has been ${status.toUpperCase()} by the vendor.`
      ]);
    } else {
      // Notify vendor
      if (order.vendor_user_id) {
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
          order.vendor_user_id,
          `Purchase Order ${order.po_number} status has been updated to ${status.toUpperCase()} by procurement team.`
        ]);
      }
    }

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Purchase Order Updated', `Purchase Order #${poId} (${order.po_number}) status changed to ${status}`]
    );

    res.json({ message: `Purchase Order status updated to ${status}` });
  } catch (err) {
    console.error('Error updating PO status:', err.message);
    res.status(500).json({ message: 'Server error updating Purchase Order' });
  }
};
