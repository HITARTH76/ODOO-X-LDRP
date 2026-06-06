const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createUsers() {
  try {
    const password = await bcrypt.hash('password123', 10);
    const users = [
      { name: 'Test Admin', email: 'admin@vendorbridge.com', role: 'Admin' },
      { name: 'Test Manager', email: 'manager@vendorbridge.com', role: 'Manager' },
      { name: 'Test Officer', email: 'officer@vendorbridge.com', role: 'Procurement Officer' },
      { name: 'Test Vendor', email: 'vendor@vendorbridge.com', role: 'Vendor' }
    ];

    for (let u of users) {
      // delete if exists
      await db.query("DELETE FROM users WHERE email = ?", [u.email]);
      
      const [res] = await db.query(
        "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'Active')",
        [u.name, u.email, password, u.role]
      );
      
      if (u.role === 'Vendor') {
        await db.query(
          "INSERT INTO vendors (user_id, company_name, category, gst_number, contact_phone, address, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            res.insertId, 
            'Test Vendor Corp', 
            'IT & Hardware', 
            'GST9999XYZ', 
            '1234567890', 
            'Test Vendor Address', 
            5.0, 
            'Active'
          ]
        );
      }
    }
    console.log("Test users created successfully.");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
createUsers();
