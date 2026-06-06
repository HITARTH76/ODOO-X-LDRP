const db = require('../config/db');

// Process Approval / Rejection (Manager only)
exports.processApproval = async (req, res) => {
  const { quotationId, status, remarks } = req.body;

  if (!quotationId || !status) {
    return res.status(400).json({ message: 'Quotation ID and status (Approved/Rejected) are required' });
  }

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    // Get quotation details
    const [quotations] = await db.query(
      'SELECT q.*, r.title as rfq_title, r.created_by as rfq_creator_id, v.company_name, v.user_id as vendor_user_id FROM quotations q JOIN rfqs r ON q.rfq_id = r.id JOIN vendors v ON q.vendor_id = v.id WHERE q.id = ?',
      [quotationId]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const quotation = quotations[0];
    const rfqId = quotation.rfq_id;

    if (quotation.status !== 'Submitted' && quotation.status !== 'Under Review') {
      return res.status(400).json({ message: `Quotation is already in ${quotation.status} state` });
    }

    // Insert Approval Record
    await db.query(
      'INSERT INTO approvals (quotation_id, approver_id, status, remarks) VALUES (?, ?, ?, ?)',
      [quotationId, req.user.id, status, remarks || '']
    );

    if (status === 'Approved') {
      // 1. Approve this quotation
      await db.query('UPDATE quotations SET status = ? WHERE id = ?', ['Approved', quotationId]);

      // 2. Reject all other quotations for the same RFQ
      await db.query('UPDATE quotations SET status = ? WHERE rfq_id = ? AND id != ?', ['Rejected', rfqId, quotationId]);

      // 3. Close the RFQ (it has been resolved)
      await db.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Closed', rfqId]);

      // 4. Notify Vendor who won
      if (quotation.vendor_user_id) {
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
          quotation.vendor_user_id,
          `Congratulations! Your quotation for RFQ: "${quotation.rfq_title}" has been APPROVED. PO generation pending.`
        ]);
      }

      // 5. Notify Procurement Officer
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        quotation.rfq_creator_id,
        `Quotation by ${quotation.company_name} for RFQ: "${quotation.rfq_title}" has been APPROVED. You can now generate the Purchase Order.`
      ]);

      // Log audit
      await db.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.id, 'Quotation Approved', `Quote ID #${quotationId} for RFQ #${rfqId} approved. All other bids rejected.`]
      );

    } else {
      // Rejection logic
      await db.query('UPDATE quotations SET status = ? WHERE id = ?', ['Rejected', quotationId]);

      // Notify Vendor who was rejected
      if (quotation.vendor_user_id) {
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
          quotation.vendor_user_id,
          `Your quotation for RFQ: "${quotation.rfq_title}" was rejected by the approving manager.`
        ]);
      }

      // Log audit
      await db.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.id, 'Quotation Rejected', `Quote ID #${quotationId} for RFQ #${rfqId} was rejected.`]
      );
    }

    res.json({ message: `Quotation has been successfully ${status.toLowerCase()}ed` });
  } catch (err) {
    console.error('Error processing approval:', err.message);
    res.status(500).json({ message: 'Server error processing approval' });
  }
};

// Get Approval Timeline/History for a Quotation
exports.getApprovalsByQuotation = async (req, res) => {
  const quotationId = req.params.quotationId;

  try {
    const [approvals] = await db.query(
      'SELECT a.*, u.name as approver_name FROM approvals a JOIN users u ON a.approver_id = u.id WHERE a.quotation_id = ? ORDER BY a.created_at DESC',
      [quotationId]
    );
    res.json(approvals);
  } catch (err) {
    console.error('Error fetching approvals:', err.message);
    res.status(500).json({ message: 'Server error fetching approvals' });
  }
};
