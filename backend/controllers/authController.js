const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register User
exports.register = async (req, res) => {
  const { name, email, password, role, companyName, category, gstNumber, phone, address } = req.body;

  try {
    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [userResult] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'Vendor', 'Active']
    );

    const userId = userResult.insertId;

    // If role is Vendor, create the vendor profile
    if (role === 'Vendor') {
      if (!companyName || !gstNumber || !phone || !address) {
        return res.status(400).json({ 
          message: 'Vendor accounts require companyName, gstNumber, phone, and address' 
        });
      }
      await db.query(
        'INSERT INTO vendors (user_id, company_name, category, gst_number, contact_phone, address, status, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, companyName, category || 'General', gstNumber, phone, address, 'Pending', 5.0]
      );
    }

    // Log action
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'User Registered', `New user registered as ${role}`]
    );

    // Generate JWT
    const payload = {
      user: {
        id: userId,
        name,
        email,
        role: role || 'Vendor'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretvendorbridgekey12345',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check status
    if (user.status === 'Inactive') {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log action
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'User Login', `${user.name} logged in successfully.`]
    );

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretvendorbridgekey12345',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Forgot Password (Simulated)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // In a production app, we would generate a token and send an email
    // Here we simulate it
    res.json({ 
      message: 'Password reset link has been sent to your email address (simulated)' 
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// Get current user details
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // If vendor role, get vendor details too
    if (user.role === 'Vendor') {
      const [vendors] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [user.id]);
      if (vendors.length > 0) {
        user.vendorDetails = vendors[0];
      }
    }

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};
