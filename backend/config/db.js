const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool = null;
let isMock = false;

// Mock Database Storage
const mockDb = {
  users: [],
  vendors: [],
  rfqs: [],
  rfq_vendors: [],
  quotations: [],
  approvals: [],
  purchase_orders: [],
  invoices: [],
  activity_logs: [],
  notifications: []
};

// Seed mock data
async function seedMockData() {
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPassword = await bcrypt.hash('admin123', salt);
  const hashedOfficerPassword = await bcrypt.hash('officer123', salt);
  const hashedVendor1Password = await bcrypt.hash('vendor123', salt);
  const hashedVendor2Password = await bcrypt.hash('vendor123', salt);
  const hashedManagerPassword = await bcrypt.hash('manager123', salt);

  mockDb.users = [
    { id: 1, name: 'Admin User', email: 'admin@vendorbridge.com', password: hashedAdminPassword, role: 'Admin', status: 'Active', created_at: new Date() },
    { id: 2, name: 'Sarah Officer', email: 'officer@vendorbridge.com', password: hashedOfficerPassword, role: 'Procurement Officer', status: 'Active', created_at: new Date() },
    { id: 3, name: 'John Vendor', email: 'vendor1@vendorbridge.com', password: hashedVendor1Password, role: 'Vendor', status: 'Active', created_at: new Date() },
    { id: 4, name: 'Dave Vendor', email: 'vendor2@vendorbridge.com', password: hashedVendor2Password, role: 'Vendor', status: 'Active', created_at: new Date() },
    { id: 5, name: 'Robert Manager', email: 'manager@vendorbridge.com', password: hashedManagerPassword, role: 'Manager', status: 'Active', created_at: new Date() }
  ];

  mockDb.vendors = [
    { id: 1, user_id: 3, company_name: 'Global Tech Solutions', category: 'IT & Hardware', gst_number: '29ABCDE1234F1Z5', contact_phone: '+91 98765 43210', address: '102 Tech Park, Bangalore, India', rating: 4.8, status: 'Active', created_at: new Date() },
    { id: 2, user_id: 4, company_name: 'Apex Industrial Supply', category: 'Raw Materials', gst_number: '27GHIJK5678L2Z9', contact_phone: '+91 91234 56789', address: '45 Industrial Area, Pune, India', rating: 4.2, status: 'Active', created_at: new Date() },
    { id: 3, user_id: null, company_name: 'Zenith Office Decors', category: 'Furniture', gst_number: '07MNOPQ9012M3Z4', contact_phone: '+91 93456 78901', address: 'Sector 62, Noida, India', rating: 4.5, status: 'Active', created_at: new Date() }
  ];

  mockDb.rfqs = [
    { id: 1, title: 'Procurement of Core i7 Laptops', description: 'Request for 50 Enterprise Laptops (16GB RAM, 512GB SSD)', quantity: 50, deadline: '2026-06-30', status: 'Active', created_by: 2, created_at: new Date() },
    { id: 2, title: 'Office Workstations Furniture', description: 'Ergonomic chairs (qty 100) and modular desks (qty 50)', quantity: 150, deadline: '2026-06-25', status: 'Active', created_by: 2, created_at: new Date() }
  ];

  mockDb.rfq_vendors = [
    { rfq_id: 1, vendor_id: 1 },
    { rfq_id: 1, vendor_id: 2 },
    { rfq_id: 2, vendor_id: 3 }
  ];

  mockDb.quotations = [
    { id: 1, rfq_id: 1, vendor_id: 1, price: 3250000.00, delivery_days: 15, remarks: 'Includes 3 years onsite warranty', status: 'Submitted', created_at: new Date() },
    { id: 2, rfq_id: 1, vendor_id: 2, price: 3100000.00, delivery_days: 20, remarks: 'Extended warranty separate', status: 'Submitted', created_at: new Date() }
  ];

  mockDb.activity_logs = [
    { id: 1, user_id: 2, action: 'RFQ Created', details: 'RFQ #1 (Core i7 Laptops) created by Sarah Officer', created_at: new Date() },
    { id: 2, user_id: 2, action: 'RFQ Created', details: 'RFQ #2 (Office Workstations Furniture) created by Sarah Officer', created_at: new Date() },
    { id: 3, user_id: 3, action: 'Quotation Submitted', details: 'Global Tech Solutions submitted a quote for RFQ #1', created_at: new Date() },
    { id: 4, user_id: 4, action: 'Quotation Submitted', details: 'Apex Industrial Supply submitted a quote for RFQ #1', created_at: new Date() }
  ];

  mockDb.notifications = [
    { id: 1, user_id: 2, message: 'New Quotation submitted for RFQ #1 by Global Tech Solutions', is_read: false, created_at: new Date() },
    { id: 2, user_id: 2, message: 'New Quotation submitted for RFQ #1 by Apex Industrial Supply', is_read: false, created_at: new Date() }
  ];
}

// Check database connection and set up pool
async function initializeDb() {
  if (process.env.MOCK_DB === 'true') {
    console.log('--------------------------------------------------');
    console.log('⚙️ MOCK_DB is set to true. Loading Mock In-Memory DB...');
    await seedMockData();
    isMock = true;
    console.log('✅ Mock Database Seeded with default roles and users.');
    console.log('   - Admin: admin@vendorbridge.com / admin123');
    console.log('   - Officer: officer@vendorbridge.com / officer123');
    console.log('   - Vendor: vendor1@vendorbridge.com / vendor123');
    console.log('   - Manager: manager@vendorbridge.com / manager123');
    console.log('--------------------------------------------------');
    return;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vendorbridge',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database Connected successfully.');
    conn.release();
  } catch (err) {
    console.log('⚠️ MySQL connection failed: ', err.message);
    console.log('🔄 Falling back to Mock In-Memory database...');
    await seedMockData();
    isMock = true;
    console.log('✅ Mock Database Initialized (Admin / Officer / Vendor / Manager).');
  }
}

// Mock Query runner
function executeMockQuery(sql, params = []) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  
  // SELECT * FROM users WHERE email = ?
  if (cleanSql.startsWith('SELECT * FROM users WHERE email =')) {
    const email = params[0];
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return [[user].filter(Boolean)];
  }

  // SELECT * FROM users WHERE id = ?
  if (cleanSql.includes('FROM users WHERE id =')) {
    const id = parseInt(params[0]);
    const user = mockDb.users.find(u => u.id === id);
    return [[user].filter(Boolean)];
  }

  // INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
  if (cleanSql.startsWith('INSERT INTO users')) {
    const newUser = {
      id: mockDb.users.length + 1,
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'Vendor',
      status: 'Active',
      created_at: new Date()
    };
    mockDb.users.push(newUser);
    return [{ insertId: newUser.id }];
  }

  // SELECT v.*, u.email FROM vendors v JOIN users u ...
  if (cleanSql.includes('FROM vendors v') && (cleanSql.includes('JOIN users u') || cleanSql.includes('LEFT JOIN users u'))) {
    let results = mockDb.vendors.map(v => {
      const u = mockDb.users.find(user => user.id === v.user_id);
      return { 
        ...v, 
        email: u ? u.email : '',
        contact_email: u ? u.email : '',
        contact_name: u ? u.name : '' 
      };
    });
    if (cleanSql.includes('WHERE v.id =')) {
      const id = parseInt(params[0]);
      results = results.filter(v => v.id === id);
    }
    return [results];
  }

  // SELECT * FROM vendors WHERE user_id = ?
  if (cleanSql.startsWith('SELECT * FROM vendors WHERE user_id =')) {
    const userId = parseInt(params[0]);
    const vendor = mockDb.vendors.find(v => v.user_id === userId);
    return [[vendor].filter(Boolean)];
  }

  // SELECT * FROM vendors WHERE id = ?
  if (cleanSql.startsWith('SELECT * FROM vendors WHERE id =')) {
    const id = parseInt(params[0]);
    const vendor = mockDb.vendors.find(v => v.id === id);
    return [[vendor].filter(Boolean)];
  }

  // SELECT * FROM vendors
  if (cleanSql.startsWith('SELECT * FROM vendors')) {
    return [mockDb.vendors];
  }

  // INSERT INTO vendors (user_id, company_name, category, gst_number, contact_phone, address)
  if (cleanSql.startsWith('INSERT INTO vendors')) {
    const newVendor = {
      id: mockDb.vendors.length + 1,
      user_id: params[0],
      company_name: params[1],
      category: params[2],
      gst_number: params[3],
      contact_phone: params[4],
      address: params[5],
      rating: 5.0,
      status: 'Pending',
      created_at: new Date()
    };
    mockDb.vendors.push(newVendor);
    return [{ insertId: newVendor.id }];
  }

  // UPDATE vendors SET status = ? WHERE id = ?
  if (cleanSql.startsWith('UPDATE vendors SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const vendor = mockDb.vendors.find(v => v.id === id);
    if (vendor) vendor.status = status;
    return [{ affectedRows: 1 }];
  }

  // SELECT r.*, u.name as creator FROM rfqs r JOIN users u
  if (cleanSql.startsWith('SELECT r.*, u.name as creator') || cleanSql.includes('FROM rfqs r')) {
    // If getting single RFQ details
    if (cleanSql.includes('WHERE r.id =')) {
      const id = parseInt(params[0]);
      const r = mockDb.rfqs.find(rfq => rfq.id === id);
      if (!r) return [[]];
      const creator = mockDb.users.find(u => u.id === r.created_by);
      return [[{ ...r, creator_name: creator ? creator.name : 'Unknown', creator: creator ? creator.name : 'Unknown' }]];
    }

    // List RFQs
    const results = mockDb.rfqs.map(r => {
      const creator = mockDb.users.find(u => u.id === r.created_by);
      return { ...r, creator_name: creator ? creator.name : 'Unknown', creator: creator ? creator.name : 'Unknown' };
    });
    return [results];
  }

  // SELECT r.* FROM rfqs r JOIN rfq_vendors rv ON r.id = rv.rfq_id WHERE rv.vendor_id = ?
  if (cleanSql.includes('FROM rfqs r JOIN rfq_vendors rv') && cleanSql.includes('WHERE rv.vendor_id =')) {
    const vendorId = parseInt(params[0]);
    const rfqIds = mockDb.rfq_vendors.filter(rv => rv.vendor_id === vendorId).map(rv => rv.rfq_id);
    const results = mockDb.rfqs.filter(r => rfqIds.includes(r.id)).map(r => {
      const creator = mockDb.users.find(u => u.id === r.created_by);
      return { ...r, creator_name: creator ? creator.name : 'Unknown', creator: creator ? creator.name : 'Unknown' };
    });
    return [results];
  }

  // SELECT v.* FROM vendors v JOIN rfq_vendors rv ON v.id = rv.vendor_id WHERE rv.rfq_id = ?
  if (cleanSql.includes('FROM vendors v JOIN rfq_vendors rv') && cleanSql.includes('WHERE rv.rfq_id =')) {
    const rfqId = parseInt(params[0]);
    const vendorIds = mockDb.rfq_vendors.filter(rv => rv.rfq_id === rfqId).map(rv => rv.vendor_id);
    const results = mockDb.vendors.filter(v => vendorIds.includes(v.id));
    return [results];
  }

  // INSERT INTO rfqs (title, description, quantity, deadline, created_by, status)
  if (cleanSql.startsWith('INSERT INTO rfqs')) {
    const newRfq = {
      id: mockDb.rfqs.length + 1,
      title: params[0],
      description: params[1],
      quantity: parseInt(params[2]),
      deadline: params[3],
      created_by: params[4],
      status: params[5] || 'Active',
      created_at: new Date()
    };
    mockDb.rfqs.push(newRfq);
    return [{ insertId: newRfq.id }];
  }

  // UPDATE rfqs SET status = ? WHERE id = ?
  if (cleanSql.startsWith('UPDATE rfqs SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const rfq = mockDb.rfqs.find(r => r.id === id);
    if (rfq) rfq.status = status;
    return [{ affectedRows: 1 }];
  }

  // INSERT INTO rfq_vendors (rfq_id, vendor_id)
  if (cleanSql.startsWith('INSERT INTO rfq_vendors')) {
    const rfq_id = parseInt(params[0]);
    const vendor_id = parseInt(params[1]);
    mockDb.rfq_vendors.push({ rfq_id, vendor_id });
    return [{ affectedRows: 1 }];
  }

  // SELECT q.*, v.company_name, v.rating, r.title as rfq_title FROM quotations q ...
  if (cleanSql.includes('FROM quotations q')) {
    let list = mockDb.quotations.map(q => {
      const v = mockDb.vendors.find(vendor => vendor.id === q.vendor_id);
      const r = mockDb.rfqs.find(rfq => rfq.id === q.rfq_id);
      return {
        ...q,
        company_name: v ? v.company_name : 'Unknown Vendor',
        rating: v ? v.rating : 5.0,
        rfq_title: r ? r.title : 'Deleted RFQ',
        rfq_status: r ? r.status : 'Active',
        quantity: r ? r.quantity : 0
      };
    });

    if (cleanSql.includes('WHERE q.rfq_id =')) {
      const rfqId = parseInt(params[0]);
      list = list.filter(q => q.rfq_id === rfqId);
    } else if (cleanSql.includes('WHERE q.vendor_id =')) {
      const vendorId = parseInt(params[0]);
      list = list.filter(q => q.vendor_id === vendorId);
    } else if (cleanSql.includes('WHERE q.id =')) {
      const id = parseInt(params[0]);
      list = list.filter(q => q.id === id);
    }
    return [list];
  }

  // INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, remarks)
  if (cleanSql.startsWith('INSERT INTO quotations')) {
    const newQuote = {
      id: mockDb.quotations.length + 1,
      rfq_id: parseInt(params[0]),
      vendor_id: parseInt(params[1]),
      price: parseFloat(params[2]),
      delivery_days: parseInt(params[3]),
      remarks: params[4],
      status: 'Submitted',
      created_at: new Date()
    };
    mockDb.quotations.push(newQuote);
    return [{ insertId: newQuote.id }];
  }

  // UPDATE quotations SET status = ? WHERE id = ?
  if (cleanSql.startsWith('UPDATE quotations SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const q = mockDb.quotations.find(quote => quote.id === id);
    if (q) q.status = status;
    return [{ affectedRows: 1 }];
  }

  // SELECT a.*, u.name as approver_name FROM approvals a JOIN users u
  if (cleanSql.includes('FROM approvals a')) {
    const results = mockDb.approvals.map(a => {
      const u = mockDb.users.find(user => user.id === a.approver_id);
      return { ...a, approver_name: u ? u.name : 'Approver' };
    });
    if (cleanSql.includes('WHERE a.quotation_id =')) {
      const qId = parseInt(params[0]);
      return [results.filter(a => a.quotation_id === qId)];
    }
    return [results];
  }

  // INSERT INTO approvals (quotation_id, approver_id, status, remarks)
  if (cleanSql.startsWith('INSERT INTO approvals')) {
    const newApproval = {
      id: mockDb.approvals.length + 1,
      quotation_id: parseInt(params[0]),
      approver_id: parseInt(params[1]),
      status: params[2],
      remarks: params[3],
      created_at: new Date()
    };
    mockDb.approvals.push(newApproval);
    return [{ insertId: newApproval.id }];
  }

  // SELECT po.*, q.price, v.company_name FROM purchase_orders po ...
  if (cleanSql.includes('FROM purchase_orders po')) {
    let results = mockDb.purchase_orders.map(po => {
      const q = mockDb.quotations.find(quote => quote.id === po.quotation_id);
      const rfq = q ? mockDb.rfqs.find(r => r.id === q.rfq_id) : null;
      const v = q ? mockDb.vendors.find(vendor => vendor.id === q.vendor_id) : null;
      return {
        ...po,
        price: q ? q.price : 0,
        company_name: v ? v.company_name : 'Unknown Vendor',
        rfq_title: rfq ? rfq.title : 'RFQ Project',
        quantity: rfq ? rfq.quantity : 0
      };
    });

    if (cleanSql.includes('WHERE po.id =')) {
      const id = parseInt(params[0]);
      return [results.filter(po => po.id === id)];
    }

    if (cleanSql.includes('WHERE q.vendor_id =')) {
      const vendorId = parseInt(params[0]);
      results = results.filter(po => {
        const q = mockDb.quotations.find(quote => quote.id === po.quotation_id);
        return q && q.vendor_id === vendorId;
      });
    }

    return [results];
  }

  // INSERT INTO purchase_orders (po_number, quotation_id, created_by, status)
  if (cleanSql.startsWith('INSERT INTO purchase_orders')) {
    const newPo = {
      id: mockDb.purchase_orders.length + 1,
      po_number: params[0],
      quotation_id: parseInt(params[1]),
      created_by: parseInt(params[2]),
      status: params[3] || 'Draft',
      created_at: new Date()
    };
    mockDb.purchase_orders.push(newPo);
    return [{ insertId: newPo.id }];
  }

  // UPDATE purchase_orders SET status = ? WHERE id = ?
  if (cleanSql.startsWith('UPDATE purchase_orders SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const po = mockDb.purchase_orders.find(o => o.id === id);
    if (po) po.status = status;
    return [{ affectedRows: 1 }];
  }

  // SELECT inv.*, po.po_number, v.company_name FROM invoices inv ...
  if (cleanSql.includes('FROM invoices inv')) {
    let results = mockDb.invoices.map(inv => {
      const po = mockDb.purchase_orders.find(p => p.id === inv.purchase_order_id);
      const q = po ? mockDb.quotations.find(quote => quote.id === po.quotation_id) : null;
      const v = q ? mockDb.vendors.find(vendor => vendor.id === q.vendor_id) : null;
      const rfq = q ? mockDb.rfqs.find(r => r.id === q.rfq_id) : null;
      return {
        ...inv,
        po_number: po ? po.po_number : '',
        company_name: v ? v.company_name : '',
        rfq_title: rfq ? rfq.title : ''
      };
    });

    if (cleanSql.includes('WHERE inv.id =')) {
      const id = parseInt(params[0]);
      return [results.filter(inv => inv.id === id)];
    }

    if (cleanSql.includes('WHERE q.vendor_id =')) {
      const vendorId = parseInt(params[0]);
      results = results.filter(inv => {
        const po = mockDb.purchase_orders.find(p => p.id === inv.purchase_order_id);
        const q = po ? mockDb.quotations.find(quote => quote.id === po.quotation_id) : null;
        return q && q.vendor_id === vendorId;
      });
    }

    return [results];
  }

  // INSERT INTO invoices (invoice_number, purchase_order_id, tax_amount, total_amount, status)
  if (cleanSql.startsWith('INSERT INTO invoices')) {
    const newInvoice = {
      id: mockDb.invoices.length + 1,
      invoice_number: params[0],
      purchase_order_id: parseInt(params[1]),
      tax_amount: parseFloat(params[2]),
      total_amount: parseFloat(params[3]),
      status: params[4] || 'Pending',
      created_at: new Date()
    };
    mockDb.invoices.push(newInvoice);
    return [{ insertId: newInvoice.id }];
  }

  // UPDATE invoices SET status = ? WHERE id = ?
  if (cleanSql.startsWith('UPDATE invoices SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const inv = mockDb.invoices.find(i => i.id === id);
    if (inv) inv.status = status;
    return [{ affectedRows: 1 }];
  }

  // SELECT l.*, u.name as user_name FROM activity_logs l ...
  if (cleanSql.includes('FROM activity_logs l')) {
    const results = mockDb.activity_logs.map(l => {
      const u = mockDb.users.find(user => user.id === l.user_id);
      return { ...l, user_name: u ? u.name : 'System' };
    }).sort((a, b) => b.created_at - a.created_at);
    return [results];
  }

  // INSERT INTO activity_logs (user_id, action, details)
  if (cleanSql.startsWith('INSERT INTO activity_logs')) {
    const newLog = {
      id: mockDb.activity_logs.length + 1,
      user_id: params[0],
      action: params[1],
      details: params[2],
      created_at: new Date()
    };
    mockDb.activity_logs.push(newLog);
    return [{ insertId: newLog.id }];
  }

  // SELECT * FROM notifications WHERE user_id = ? ...
  if (cleanSql.includes('FROM notifications')) {
    let results = mockDb.notifications;
    if (cleanSql.includes('WHERE user_id =')) {
      const userId = parseInt(params[0]);
      results = results.filter(n => n.user_id === userId);
    }
    return [results.sort((a, b) => b.created_at - a.created_at)];
  }

  // INSERT INTO notifications (user_id, message)
  if (cleanSql.startsWith('INSERT INTO notifications')) {
    const newNotif = {
      id: mockDb.notifications.length + 1,
      user_id: parseInt(params[0]),
      message: params[1],
      is_read: false,
      created_at: new Date()
    };
    mockDb.notifications.push(newNotif);
    return [{ insertId: newNotif.id }];
  }

  // UPDATE notifications SET is_read = true WHERE user_id = ?
  if (cleanSql.startsWith('UPDATE notifications SET is_read = true WHERE user_id =')) {
    const userId = parseInt(params[0]);
    mockDb.notifications.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    return [{ affectedRows: 1 }];
  }

  // Generic fallback log
  console.log('❓ Mock DB Query unhandled. Query:', cleanSql, 'Params:', params);
  return [[]];
}

// Wrapper for query execution
async function query(sql, params = []) {
  if (isMock) {
    return executeMockQuery(sql, params);
  }
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error('❌ SQL Query Error, falling back to mock query handler. Query:', sql, 'Error:', err.message);
    return executeMockQuery(sql, params);
  }
}

// Auto-initialize connection
initializeDb();

module.exports = {
  query,
  isMock: () => isMock
};