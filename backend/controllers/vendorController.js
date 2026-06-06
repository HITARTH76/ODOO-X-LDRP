const db = require('../config/db');

// Get all vendors (with user details)
exports.getAllVendors = async (req, res) => {
  try {
    let queryStr = 'SELECT v.*, u.email as contact_email, u.name as contact_name FROM vendors v LEFT JOIN users u ON v.user_id = u.id';
    let params = [];
    
    // If the user is a Vendor, they can only see their own profile
    if (req.user.role === 'Vendor') {
      queryStr += ' WHERE v.user_id = ?';
      params.push(req.user.id);
    }
    
    const [vendors] = await db.query(queryStr, params);
    res.json(vendors);
  } catch (err) {
    console.error('Error fetching vendors:', err.message);
    res.status(500).json({ message: 'Server error fetching vendors' });
  }
};

// Get single vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const [vendors] = await db.query(
      'SELECT v.*, u.email as contact_email, u.name as contact_name FROM vendors v LEFT JOIN users u ON v.user_id = u.id WHERE v.id = ?',
      [req.params.id]
    );

    if (vendors.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendors[0]);
  } catch (err) {
    console.error('Error fetching vendor:', err.message);
    res.status(500).json({ message: 'Server error fetching vendor details' });
  }
};

// Update vendor status (Admin only)
exports.updateVendorStatus = async (req, res) => {
  let { status } = req.body;
  
  // Resilient mapping: if frontend sends 'Approved', map it back to 'Active' for the database
  if (status === 'Approved') {
    status = 'Active';
  }

  if (!['Pending', 'Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [vendorResult] = await db.query('SELECT * FROM vendors WHERE id = ?', [req.params.id]);
    if (vendorResult.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await db.query('UPDATE vendors SET status = ? WHERE id = ?', [status, req.params.id]);
    
    // Log the audit trail
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Vendor Status Updated', `Vendor ID ${req.params.id} status changed to ${status}`]
    );

    res.json({ message: `Vendor status updated to ${status}` });
  } catch (err) {
    console.error('Error updating vendor status:', err.message);
    res.status(500).json({ message: 'Server error updating vendor status' });
  }
};

// Get vendor profile of logged-in vendor user
exports.getVendorProfile = async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.id]);
    if (vendors.length === 0) {
      return res.status(404).json({ message: 'Vendor profile not found for this user account' });
    }
    res.json(vendors[0]);
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ message: 'Server error fetching vendor profile' });
  }
};
