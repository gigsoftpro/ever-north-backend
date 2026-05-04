const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Protect a route — requires valid Bearer JWT
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ success: false, message: msg });
    }

    // Verify admin still exists in DB
    const [rows] = await pool.execute(
      'SELECT id, username, email, role FROM admins WHERE id = ?',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.admin = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict to superadmin only
 */
function superAdminOnly(req, res, next) {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Superadmin access required' });
  }
  next();
}

module.exports = { protect, superAdminOnly };
