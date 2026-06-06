const db = require('./config/db');

async function seedDatabase() {
  console.log("Seeding Database with fake data...");

  try {
    // Get Users
    const [officers] = await db.query("SELECT id FROM users WHERE role = 'Procurement Officer'");
    const [vendorsUser] = await db.query("SELECT id, name, email FROM users WHERE role = 'Vendor'");
    const [managers] = await db.query("SELECT id FROM users WHERE role = 'Manager'");

    if (officers.length === 0 || vendorsUser.length === 0 || managers.length === 0) {
      console.log("Not enough users to seed correctly. Make sure you have at least 1 of each role.");
      process.exit(1);
    }

    const officerId = officers[0].id;
    const managerId = managers[0].id;

    // 1. Create Vendors profiles for Vendor users if they don't exist
    console.log("Seeding Vendors...");
    for (let vu of vendorsUser) {
      const [existing] = await db.query("SELECT id FROM vendors WHERE user_id = ?", [vu.id]);
      if (existing.length === 0) {
        await db.query(
          "INSERT INTO vendors (user_id, company_name, category, gst_number, contact_phone, address, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            vu.id, 
            vu.name + ' Enterprises', 
            ['IT & Hardware', 'Raw Materials', 'Furniture'][Math.floor(Math.random() * 3)], 
            'GST' + Math.floor(Math.random() * 10000) + 'XYZ', 
            '1234567890', 
            '123 Vendor Street, City', 
            4.5, 
            'Active'
          ]
        );
      }
    }
    const [vendors] = await db.query("SELECT id, user_id FROM vendors");

    // 2. Create RFQs
    console.log("Seeding RFQs...");
    const rfqTitles = [
      "Supply of Laptops (Dell Latitude)",
      "Office Furniture Setup (Desks & Chairs)",
      "Steel Pipes for Construction",
      "Network Switches & Routers",
      "Janitorial Supplies (Bulk)"
    ];
    
    for (let i = 0; i < 15; i++) {
      const title = rfqTitles[Math.floor(Math.random() * rfqTitles.length)] + " - Batch " + i;
      const statuses = ['Draft', 'Active', 'Closed', 'Completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const [rfqRes] = await db.query(
        "INSERT INTO rfqs (title, description, quantity, deadline, status, created_by, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          title, 
          "We need high quality " + title + " urgently.", 
          Math.floor(Math.random() * 100) + 10, 
          new Date(Date.now() + Math.random() * 10000000000), 
          status, 
          officerId, 
          ['IT & Hardware', 'Raw Materials', 'Furniture'][Math.floor(Math.random() * 3)]
        ]
      );
      
      const rfqId = rfqRes.insertId;

      // Assign to random vendors
      for (let v of vendors) {
        if (Math.random() > 0.5) {
          await db.query("INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)", [rfqId, v.id]);
          
          // Generate Quotation if RFQ is Active, Closed or Completed
          if (status !== 'Draft') {
            const qStatus = ['Submitted', 'Under Review', 'Approved', 'Rejected'][Math.floor(Math.random() * 4)];
            const price = Math.floor(Math.random() * 50000) + 5000;
            
            const [qRes] = await db.query(
              "INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, remarks, status) VALUES (?, ?, ?, ?, ?, ?)",
              [rfqId, v.id, price, Math.floor(Math.random() * 14) + 1, "Best price guaranteed.", qStatus]
            );
            
            const qId = qRes.insertId;

            // Generate Approval if Approved
            if (qStatus === 'Approved') {
              await db.query(
                "INSERT INTO approvals (quotation_id, approver_id, status, remarks) VALUES (?, ?, ?, ?)",
                [qId, managerId, 'Approved', "Looks good. Go ahead."]
              );

              // Create PO
              const poStatus = ['Sent', 'Accepted', 'Completed'][Math.floor(Math.random() * 3)];
              const [poRes] = await db.query(
                "INSERT INTO purchase_orders (po_number, quotation_id, status, created_by) VALUES (?, ?, ?, ?)",
                ['PO-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000), qId, poStatus, officerId]
              );
              
              const poId = poRes.insertId;

              // Create Invoice if Completed
              if (poStatus === 'Completed') {
                const tax = price * 0.18;
                const total = price + tax;
                const invStatus = ['Pending', 'Paid'][Math.floor(Math.random() * 2)];
                // Subtract some months to give trend data
                const createdDate = new Date(Date.now() - Math.random() * 15000000000); // within last 5-6 months
                await db.query(
                  "INSERT INTO invoices (invoice_number, purchase_order_id, tax_amount, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                  ['INV-' + Date.now().toString().slice(-6), poId, tax, total, invStatus, createdDate]
                );
              }
            }
          }
        }
      }
    }

    console.log("Seeding complete! You now have plenty of RFQs, quotations, approvals, purchase orders, and invoices.");
  } catch (err) {
    console.error("Error seeding DB:", err);
  }
  process.exit(0);
}

seedDatabase();
