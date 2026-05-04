/**
 * Creates or resets the admin user with a bcrypt-hashed password.
 * Usage:  node scripts/createAdmin.js
 *
 * Reads ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/db');

async function createAdmin() {
  console.log('\n🔐  Ever North — Admin Setup\n');

  await testConnection();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const email    = process.env.ADMIN_EMAIL    || 'admin@evernorth.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';

  if (password.length < 8) {
    console.error('❌  ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  // Upsert: update if exists, insert if not
  const [existing] = await pool.execute(
    'SELECT id FROM admins WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existing.length) {
    await pool.execute(
      'UPDATE admins SET password_hash = ?, username = ?, email = ? WHERE id = ?',
      [hash, username, email, existing[0].id]
    );
    console.log(`✅  Admin updated: ${username} (${email})`);
  } else {
    await pool.execute(
      'INSERT INTO admins (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hash, 'superadmin']
    );
    console.log(`✅  Admin created: ${username} (${email})`);
  }

  console.log(`🔑  Password: ${password}`);
  console.log('\n👉  You can now log in at POST /api/auth/login\n');

  process.exit(0);
}

createAdmin().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
