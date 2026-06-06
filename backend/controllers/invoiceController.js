const db = require('../config/db');
const emailService = require('../utils/emailService');

// Generate Invoice from Purchase Order (Procurement Officer / Admin)
exports.createInvoice = async (req, res) => {
  const { purchaseOrderId } = req.body;

  if (!purchaseOrderId) {
    return res.status(400).json({ message: 'Purchase Order ID is required' });
  }

  try {
    // Get PO details
    const [orders] = await db.query(
      `
      SELECT po.*, q.price, v.company_name, v.user_id as vendor_user_id
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      WHERE po.id = ?
      `,
      [purchaseOrderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const order = orders[0];

    // Verify vendor authorization if role is Vendor
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0 || vendors[0].id !== order.vendor_user_id) {
        // Wait, vendor_user_id is v.user_id, which matches req.user.id
        if (req.user.id !== order.vendor_user_id) {
          return res.status(403).json({ message: 'Access denied: You are not the vendor for this Purchase Order' });
        }
      }
    }

    // Check if invoice already generated for this PO
    const [existingInvoice] = await db.query('SELECT id FROM invoices WHERE purchase_order_id = ?', [purchaseOrderId]);
    if (existingInvoice.length > 0) {
      return res.status(400).json({ message: 'An Invoice has already been generated for this Purchase Order' });
    }

    // Tax calculation (18% GST standard)
    const basePrice = parseFloat(order.price);
    const taxAmount = basePrice * 0.18;
    const totalAmount = basePrice + taxAmount;

    // Generate Invoice Number: INV-YYYYMMDD-[4 Random digits]
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randDigits}`;

    // Create Invoice
    const [invoiceResult] = await db.query(
      'INSERT INTO invoices (invoice_number, purchase_order_id, tax_amount, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [invoiceNumber, purchaseOrderId, taxAmount, totalAmount, 'Pending']
    );

    const invoiceId = invoiceResult.insertId;

    // Update PO status to Completed
    await db.query('UPDATE purchase_orders SET status = ? WHERE id = ?', ['Completed', purchaseOrderId]);

    // Notify Vendor
    if (order.vendor_user_id) {
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        order.vendor_user_id,
        `Invoice ${invoiceNumber} generated for Purchase Order ${order.po_number}. Payment Pending.`
      ]);
    }

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Invoice Generated', `Generated invoice ${invoiceNumber} for PO #${purchaseOrderId}. Total: ${totalAmount.toFixed(2)} USD (incl. 18% GST)`]
    );

    res.status(201).json({ message: 'Invoice generated successfully', invoiceId, invoiceNumber });
  } catch (err) {
    console.error('Error generating invoice:', err.message);
    res.status(500).json({ message: 'Server error generating invoice' });
  }
};

// Get All Invoices
exports.getAllInvoices = async (req, res) => {
  try {
    let queryStr = `
      SELECT inv.*, po.po_number, q.price as base_amount, v.company_name, r.title as rfq_title
      FROM invoices inv
      JOIN purchase_orders po ON inv.purchase_order_id = po.id
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
    `;
    let params = [];

    // If Vendor role, only show invoices related to their quotations
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0) {
        return res.json([]);
      }
      const vendorId = vendors[0].id;
      queryStr += ' WHERE q.vendor_id = ?';
      params = [vendorId];
    }

    const [invoices] = await db.query(queryStr, params);
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err.message);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

// Get Invoice by ID
exports.getInvoiceById = async (req, res) => {
  const invoiceId = req.params.id;

  try {
    const [invoices] = await db.query(
      `
      SELECT inv.*, po.po_number, po.created_at as po_date, q.price as base_amount, 
             v.company_name, v.gst_number, v.contact_phone, v.address, r.title as rfq_title, r.quantity
      FROM invoices inv
      JOIN purchase_orders po ON inv.purchase_order_id = po.id
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE inv.id = ?
      `,
      [invoiceId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Vendor access verification
    if (req.user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT id FROM vendors WHERE user_id = ?', [req.user.id]);
      if (vendors.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const vendorId = vendors[0].id;
      
      const [poCheck] = await db.query(
        'SELECT q.vendor_id FROM purchase_orders po JOIN quotations q ON po.quotation_id = q.id WHERE po.id = ?',
        [invoice.purchase_order_id]
      );

      if (poCheck.length === 0 || poCheck[0].vendor_id !== vendorId) {
        return res.status(403).json({ message: 'Access denied: You are not the vendor for this invoice' });
      }
    }

    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice details:', err.message);
    res.status(500).json({ message: 'Server error fetching invoice details' });
  }
};

// Send Invoice via Email (Simulated)
exports.sendInvoiceEmail = async (req, res) => {
  const invoiceId = req.params.id;
  const { emailAddress } = req.body;

  if (!emailAddress) {
    return res.status(400).json({ message: 'Recipient email address is required' });
  }

  try {
    const [invoices] = await db.query(
      `
      SELECT inv.*, po.po_number, v.company_name, r.title as rfq_title
      FROM invoices inv
      JOIN purchase_orders po ON inv.purchase_order_id = po.id
      JOIN quotations q ON po.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE inv.id = ?
      `,
      [invoiceId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Trigger simulation and get real test URL
    const previewUrl = await emailService.sendInvoiceEmail(emailAddress, invoice);

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Invoice Emailed', `Invoice ${invoice.invoice_number} sent to ${emailAddress}`]
    );

    res.json({ 
      message: `Invoice ${invoice.invoice_number} has been emailed to ${emailAddress} successfully.`,
      previewUrl
    });
  } catch (err) {
    console.error('Error sending invoice email:', err.message);
    res.status(500).json({ message: 'Server error emailing invoice' });
  }
};

// Update Invoice Status (e.g. Paid)
exports.updateInvoiceStatus = async (req, res) => {
  const { status } = req.body;
  const invoiceId = req.params.id;

  if (!['Paid', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [invoices] = await db.query(
      'SELECT inv.*, po.po_number, v.user_id as vendor_user_id FROM invoices inv JOIN purchase_orders po ON inv.purchase_order_id = po.id JOIN quotations q ON po.quotation_id = q.id JOIN vendors v ON q.vendor_id = v.id WHERE inv.id = ?',
      [invoiceId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    await db.query('UPDATE invoices SET status = ? WHERE id = ?', [status, invoiceId]);

    // Notify vendor
    if (invoice.vendor_user_id) {
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        invoice.vendor_user_id,
        `Payment Status Updated: Invoice ${invoice.invoice_number} is now marked as ${status.toUpperCase()}`
      ]);
    }

    // Log audit
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Invoice Status Updated', `Invoice #${invoiceId} (${invoice.invoice_number}) marked as ${status}`]
    );

    res.json({ message: `Invoice status updated to ${status}` });
  } catch (err) {
    console.error('Error updating invoice status:', err.message);
    res.status(500).json({ message: 'Server error updating invoice status' });
  }
};
