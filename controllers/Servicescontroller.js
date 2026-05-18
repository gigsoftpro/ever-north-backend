// controllers/servicesController.js
// Add route to server.js:  app.use('/api/services', require('./routes/services'));

const { pool } = require("../config/db");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mediaUrl(req, filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${req.protocol}://${req.get("host")}${filePath}`;
}

async function attachMedia(req, row, field) {
  if (!row) return row;
  const idKey = `${field}_id`;
  if (row[idKey]) {
    const [rows] = await pool.execute("SELECT * FROM media WHERE id = ?", [
      row[idKey],
    ]);
    row[field] = rows[0]
      ? { ...rows[0], url: mediaUrl(req, rows[0].path) }
      : null;
  } else {
    row[field] = null;
  }
  return row;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE META — full read + update
// ═══════════════════════════════════════════════════════════════════════════════

async function getServicesPage(req, res, next) {
  try {
    // Fetch the single-row meta record
    const [[meta]] = await pool.execute("SELECT * FROM services_page LIMIT 1");

    // Attach image objects for all image fields
    await attachMedia(req, meta, "intro_image");
    await attachMedia(req, meta, "short_term_image");
    await attachMedia(req, meta, "long_term_image");
    await attachMedia(req, meta, "airbnb_image");
    await attachMedia(req, meta, "faq_image");

    // Fetch why-item bullets grouped by section_key
    const [shortTermWhy] = await pool.execute(
      "SELECT * FROM services_why_items WHERE section_key = 'short_term' ORDER BY sort_order ASC",
    );
    const [longTermWhy] = await pool.execute(
      "SELECT * FROM services_why_items WHERE section_key = 'long_term' ORDER BY sort_order ASC",
    );
    const [airbnbWhy] = await pool.execute(
      "SELECT * FROM services_why_items WHERE section_key = 'airbnb' ORDER BY sort_order ASC",
    );
    const [faq] = await pool.execute(
      "SELECT * FROM services_faq ORDER BY sort_order ASC",
    );

    res.json({
      success: true,
      data: {
        meta,
        short_term_why: shortTermWhy,
        long_term_why: longTermWhy,
        airbnb_why: airbnbWhy,
        faq,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateServicesPage(req, res, next) {
  try {
    const {
      intro_title,
      intro_para_1,
      intro_para_2,
      intro_image_id,

      short_term_title,
      short_term_subtitle,
      short_term_desc,
      short_term_cta_text,
      short_term_cta_href,
      short_term_why_title,
      short_term_image_id,

      long_term_title,
      long_term_subtitle,
      long_term_desc,
      long_term_cta_text,
      long_term_cta_href,
      long_term_why_title,
      long_term_image_id,

      airbnb_title,
      airbnb_subtitle,
      airbnb_desc,
      airbnb_cta_text,
      airbnb_cta_href,
      airbnb_why_title,
      airbnb_image_id,

      faq_title,
      faq_image_id,
    } = req.body;

    await pool.execute(
      `UPDATE services_page SET
        intro_title            = COALESCE(?, intro_title),
        intro_para_1           = COALESCE(?, intro_para_1),
        intro_para_2           = COALESCE(?, intro_para_2),
        intro_image_id         = COALESCE(?, intro_image_id),

        short_term_title       = COALESCE(?, short_term_title),
        short_term_subtitle    = COALESCE(?, short_term_subtitle),
        short_term_desc        = COALESCE(?, short_term_desc),
        short_term_cta_text    = COALESCE(?, short_term_cta_text),
        short_term_cta_href    = COALESCE(?, short_term_cta_href),
        short_term_why_title   = COALESCE(?, short_term_why_title),
        short_term_image_id    = COALESCE(?, short_term_image_id),

        long_term_title        = COALESCE(?, long_term_title),
        long_term_subtitle     = COALESCE(?, long_term_subtitle),
        long_term_desc         = COALESCE(?, long_term_desc),
        long_term_cta_text     = COALESCE(?, long_term_cta_text),
        long_term_cta_href     = COALESCE(?, long_term_cta_href),
        long_term_why_title    = COALESCE(?, long_term_why_title),
        long_term_image_id     = COALESCE(?, long_term_image_id),

        airbnb_title           = COALESCE(?, airbnb_title),
        airbnb_subtitle        = COALESCE(?, airbnb_subtitle),
        airbnb_desc            = COALESCE(?, airbnb_desc),
        airbnb_cta_text        = COALESCE(?, airbnb_cta_text),
        airbnb_cta_href        = COALESCE(?, airbnb_cta_href),
        airbnb_why_title       = COALESCE(?, airbnb_why_title),
        airbnb_image_id        = COALESCE(?, airbnb_image_id),

        faq_title              = COALESCE(?, faq_title),
        faq_image_id           = COALESCE(?, faq_image_id)
       WHERE id = 1`,
      [
        intro_title,
        intro_para_1,
        intro_para_2,
        intro_image_id ?? null,

        short_term_title,
        short_term_subtitle,
        short_term_desc,
        short_term_cta_text,
        short_term_cta_href,
        short_term_why_title,
        short_term_image_id ?? null,

        long_term_title,
        long_term_subtitle,
        long_term_desc,
        long_term_cta_text,
        long_term_cta_href,
        long_term_why_title,
        long_term_image_id ?? null,

        airbnb_title,
        airbnb_subtitle,
        airbnb_desc,
        airbnb_cta_text,
        airbnb_cta_href,
        airbnb_why_title,
        airbnb_image_id ?? null,

        faq_title,
        faq_image_id ?? null,
      ],
    );

    res.json({ success: true, message: "Services page updated" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY ITEMS  (bullet lists per section)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /why-items?section_key=short_term  (optional filter) */
async function getWhyItems(req, res, next) {
  try {
    const { section_key } = req.query;
    let query = "SELECT * FROM services_why_items";
    const params = [];
    if (section_key) {
      query += " WHERE section_key = ?";
      params.push(section_key);
    }
    query += " ORDER BY section_key ASC, sort_order ASC";
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/** POST /why-items */
async function createWhyItem(req, res, next) {
  try {
    const { section_key, text, sort_order } = req.body;

    if (
      !section_key ||
      !["short_term", "long_term", "airbnb"].includes(section_key)
    ) {
      return res.status(400).json({
        success: false,
        message: "section_key must be one of: short_term, long_term, airbnb",
      });
    }
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "text is required" });
    }

    const [r] = await pool.execute(
      "INSERT INTO services_why_items (section_key, text, sort_order) VALUES (?, ?, ?)",
      [section_key, text, sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM services_why_items WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

/** PUT /why-items/:id */
async function updateWhyItem(req, res, next) {
  try {
    const { id } = req.params;
    const { text, sort_order, is_active, section_key } = req.body;

    await pool.execute(
      `UPDATE services_why_items SET
        text        = COALESCE(?, text),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active),
        section_key = COALESCE(?, section_key)
       WHERE id = ?`,
      [text, sort_order, is_active ?? null, section_key ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM services_why_items WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

/** DELETE /why-items/:id */
async function deleteWhyItem(req, res, next) {
  try {
    await pool.execute("DELETE FROM services_why_items WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /faq */
async function getFaq(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM services_faq ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/** POST /faq */
async function createFaqItem(req, res, next) {
  try {
    const { question, answer, sort_order } = req.body;
    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "question is required" });
    }
    const [r] = await pool.execute(
      "INSERT INTO services_faq (question, answer, sort_order) VALUES (?, ?, ?)",
      [question, answer || "", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM services_faq WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

/** PUT /faq/:id */
async function updateFaqItem(req, res, next) {
  try {
    const { id } = req.params;
    const { question, answer, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE services_faq SET
        question   = COALESCE(?, question),
        answer     = COALESCE(?, answer),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [question, answer, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM services_faq WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

/** DELETE /faq/:id */
async function deleteFaqItem(req, res, next) {
  try {
    await pool.execute("DELETE FROM services_faq WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getServicesPage,
  updateServicesPage,
  getWhyItems,
  createWhyItem,
  updateWhyItem,
  deleteWhyItem,
  getFaq,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
};
