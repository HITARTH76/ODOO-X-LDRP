const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function updateAdmin() {
  const email = 'admin@gmail.com';
  const plainPassword = 'Admin@123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  try {
    // Update the existing admin@gmail.com account to be an Admin with the new password
    await db.query('UPDATE users SET role = "Admin", password = ? WHERE email = ?', [hashedPassword, email]);
    console.log('Admin account (admin@gmail.com) successfully updated with new password and Admin role.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

updateAdmin();
