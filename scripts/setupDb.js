/**
 * Run this ONCE to create the database, all tables and seed data.
 * Usage:  node scripts/setupDb.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function setup() {
  console.log('\n📦  Ever North — Database Setup\n');

  // Connect WITHOUT specifying a database first
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('⚙️   Running schema.sql …');
  await conn.query(sql);

  console.log('✅  Database and tables created successfully!');
  console.log('');
  console.log('👉  Next step: run  node scripts/createAdmin.js  to set the admin password.\n');

  await conn.end();
  process.exit(0);
}

setup().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
