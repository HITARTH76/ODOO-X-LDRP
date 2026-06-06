const db = require('./config/db');

async function test() {
  const [users] = await db.query('SELECT * FROM users WHERE name LIKE "%adil%"');
  console.log("USERS:", users);
  
  if (users.length > 0) {
    const [vendors] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [users[0].id]);
    console.log("VENDORS:", vendors);
    
    // Simulate req object
    const req = { user: users[0] };
    const res = {
      json: (data) => console.log("RESPONSE:", JSON.stringify(data)),
      status: (code) => ({ json: (err) => console.error("ERROR", code, err) })
    };
    
    const reportController = require('./controllers/reportController');
    await reportController.getAnalyticsReports(req, res);
  }
  process.exit(0);
}
test();
