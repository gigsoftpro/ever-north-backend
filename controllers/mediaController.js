const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { UPLOAD_DIR } = require('../middleware/upload');

// POST /api/media — upload a file
async function uploadMedia(req, res, next) {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { filename, originalName, mimetype, size, path: filePath } = req.uploadedFile;
    const section = req.body.section || 'general';

    const [result] = await pool.execute(
      `INSERT INTO media (filename, original_name, mimetype, size, path, section, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [filename, originalName, mimetype, size, filePath, section, req.admin.id]
    );

    const [rows] = await pool.execute('SELECT * FROM media WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, media: rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/media — list all media, optional ?section= filter
async function listMedia(req, res, next) {
  try {
    const { section, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM media';
    const params = [];

    if (section) {
      query += ' WHERE section = ?';
      params.push(section);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    // Count
    let countQ = 'SELECT COUNT(*) AS total FROM media';
    const countP = [];
    if (section) { countQ += ' WHERE section = ?'; countP.push(section); }
    const [[{ total }]] = await pool.execute(countQ, countP);

    res.json({ success: true, total, page: parseInt(page), limit: parseInt(limit), media: rows });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/media/:id
async function deleteMedia(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const media = rows[0];
    const diskPath = path.join(UPLOAD_DIR, media.filename);
    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);

    await pool.execute('DELETE FROM media WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Media deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadMedia, listMedia, deleteMedia };
