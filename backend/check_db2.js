const db = require('./config/db');

async function checkDb() {
  try {
    const [createTable] = await db.query('SHOW CREATE TABLE quotations');
    console.log(createTable[0]['Create Table']);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
