const db = require('./config/db');
const reportController = require('./controllers/reportController');

async function test() {
  const req = { user: { role: 'Vendor', id: 24 } }; // Assuming adil patel's user.id is 24 based on earlier logs
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (err) => console.error("STATUS", code, err) })
  };
  await reportController.getAnalyticsReports(req, res);
  process.exit(0);
}
test();
