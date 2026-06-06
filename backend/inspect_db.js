const db = require('./config/db');

async function inspect() {
  const [tables] = await db.query('SHOW TABLES');
  for (let tableObj of tables) {
    const tableName = Object.values(tableObj)[0];
    const [columns] = await db.query(`DESCRIBE ${tableName}`);
    console.log(`\nTable: ${tableName}`);
    columns.forEach(col => console.log(`  ${col.Field} - ${col.Type}`));
  }
  process.exit(0);
}
inspect();
