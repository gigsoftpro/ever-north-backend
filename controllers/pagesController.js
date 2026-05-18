// controllers/pagesController.js
const { pool } = require("../config/db");

// ─── Shared helpers ───────────────────────────────────────────────────────────
function mediaUrl(req, filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${req.protocol}://${req.get("host")}${filePath}`;
}

async function attachMedia(req, row, fieldName) {
  if (!row) return row;
  const idField = `${fieldName}_id`;
  if (row[idField]) {
    const [rows] = await pool.execute("SELECT * FROM media WHERE id = ?", [
      row[idField],
    ]);
    row[fieldName] = rows[0]
      ? { ...rows[0], url: mediaUrl(req, rows[0].path) }
      : null;
  } else {
    row[fieldName] = null;
  }
  return row;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

async function getContactPage(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM contact_page LIMIT 1");
    const data = await attachMedia(req, row, "banner_image");
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateContactPage(req, res, next) {
  try {
    const {
      banner_image_id,
      banner_title,
      banner_subtitle,
      section_heading,
      section_description,
    } = req.body;
    await pool.execute(
      `UPDATE contact_page SET
        banner_image_id     = COALESCE(?, banner_image_id),
        banner_title        = COALESCE(?, banner_title),
        banner_subtitle     = COALESCE(?, banner_subtitle),
        section_heading     = COALESCE(?, section_heading),
        section_description = COALESCE(?, section_description)
       WHERE id = 1`,
      [
        banner_image_id ?? null,
        banner_title,
        banner_subtitle,
        section_heading,
        section_description,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM contact_page LIMIT 1");
    const data = await attachMedia(req, row, "banner_image");
    res.json({ success: true, message: "Contact page updated", data });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE — META
// ═══════════════════════════════════════════════════════════════════════════════

async function getAboutPage(req, res, next) {
  try {
    const [[meta]] = await pool.execute("SELECT * FROM about_page LIMIT 1");
    await attachMedia(req, meta, "banner_image");
    await attachMedia(req, meta, "why_choose_image");
    await attachMedia(req, meta, "who_we_are_image");
    await attachMedia(req, meta, "cta_bg_image");

    const [whyItems] = await pool.execute(
      "SELECT * FROM about_why_choose_items ORDER BY sort_order ASC",
    );
    const [stats] = await pool.execute(
      "SELECT * FROM about_stats ORDER BY sort_order ASC",
    );
    const [values] = await pool.execute(
      "SELECT * FROM about_core_values ORDER BY sort_order ASC",
    );

    res.json({
      success: true,
      data: {
        meta,
        why_choose_items: whyItems,
        stats: {
          who_we_are: stats.filter((s) => s.section === "who_we_are"),
          banner: stats.filter((s) => s.section === "banner"),
        },
        core_values: values,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateAboutPage(req, res, next) {
  try {
    const {
      banner_image_id,
      banner_title,
      banner_subtitle,
      banner_cta_text,
      banner_cta_href,
      why_choose_title,
      why_choose_image_id,
      who_we_are_heading,
      who_we_are_text,
      who_we_are_image_id,
      core_values_heading,
      cta_bg_image_id,
      cta_heading,
      cta_description,
      cta_btn1_text,
      cta_btn1_href,
      cta_btn2_text,
      cta_btn2_href,
    } = req.body;

    await pool.execute(
      `UPDATE about_page SET
        banner_image_id     = COALESCE(?, banner_image_id),
        banner_title        = COALESCE(?, banner_title),
        banner_subtitle     = COALESCE(?, banner_subtitle),
        banner_cta_text     = COALESCE(?, banner_cta_text),
        banner_cta_href     = COALESCE(?, banner_cta_href),
        why_choose_title    = COALESCE(?, why_choose_title),
        why_choose_image_id = COALESCE(?, why_choose_image_id),
        who_we_are_heading  = COALESCE(?, who_we_are_heading),
        who_we_are_text     = COALESCE(?, who_we_are_text),
        who_we_are_image_id = COALESCE(?, who_we_are_image_id),
        core_values_heading = COALESCE(?, core_values_heading),
        cta_bg_image_id     = COALESCE(?, cta_bg_image_id),
        cta_heading         = COALESCE(?, cta_heading),
        cta_description     = COALESCE(?, cta_description),
        cta_btn1_text       = COALESCE(?, cta_btn1_text),
        cta_btn1_href       = COALESCE(?, cta_btn1_href),
        cta_btn2_text       = COALESCE(?, cta_btn2_text),
        cta_btn2_href       = COALESCE(?, cta_btn2_href)
       WHERE id = 1`,
      [
        banner_image_id ?? null,
        banner_title,
        banner_subtitle,
        banner_cta_text,
        banner_cta_href,
        why_choose_title,
        why_choose_image_id ?? null,
        who_we_are_heading,
        who_we_are_text,
        who_we_are_image_id ?? null,
        core_values_heading,
        cta_bg_image_id ?? null,
        cta_heading,
        cta_description,
        cta_btn1_text,
        cta_btn1_href,
        cta_btn2_text,
        cta_btn2_href,
      ],
    );
    res.json({ success: true, message: "About page updated" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY CHOOSE ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

async function getAllWhyChooseItems(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM about_why_choose_items ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createWhyChooseItem(req, res, next) {
  try {
    const { text, sort_order } = req.body;
    if (!text)
      return res
        .status(400)
        .json({ success: false, message: "text is required" });
    const [r] = await pool.execute(
      "INSERT INTO about_why_choose_items (text, sort_order) VALUES (?, ?)",
      [text, sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_why_choose_items WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateWhyChooseItem(req, res, next) {
  try {
    const { id } = req.params;
    const { text, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE about_why_choose_items SET
        text       = COALESCE(?, text),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [text, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_why_choose_items WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteWhyChooseItem(req, res, next) {
  try {
    await pool.execute("DELETE FROM about_why_choose_items WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

async function getAllStats(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM about_stats ORDER BY section, sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createStat(req, res, next) {
  try {
    const { value, label, section, sort_order } = req.body;
    if (!value || !label)
      return res
        .status(400)
        .json({ success: false, message: "value and label are required" });
    const [r] = await pool.execute(
      "INSERT INTO about_stats (value, label, section, sort_order) VALUES (?, ?, ?, ?)",
      [value, label, section || "banner", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_stats WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateStat(req, res, next) {
  try {
    const { id } = req.params;
    const { value, label, section, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE about_stats SET
        value      = COALESCE(?, value),
        label      = COALESCE(?, label),
        section    = COALESCE(?, section),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [value, label, section, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_stats WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteStat(req, res, next) {
  try {
    await pool.execute("DELETE FROM about_stats WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE VALUES
// ═══════════════════════════════════════════════════════════════════════════════

async function getAllCoreValues(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM about_core_values ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createCoreValue(req, res, next) {
  try {
    const { emoji, title, description, sort_order } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    const [r] = await pool.execute(
      "INSERT INTO about_core_values (emoji, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [emoji || "⭐", title, description || "", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_core_values WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateCoreValue(req, res, next) {
  try {
    const { id } = req.params;
    const { emoji, title, description, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE about_core_values SET
        emoji       = COALESCE(?, emoji),
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [emoji, title, description, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM about_core_values WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteCoreValue(req, res, next) {
  try {
    await pool.execute("DELETE FROM about_core_values WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Contact page
  getContactPage,
  updateContactPage,
  // About page
  getAboutPage,
  updateAboutPage,
  // Why Choose Items
  getAllWhyChooseItems,
  createWhyChooseItem,
  updateWhyChooseItem,
  deleteWhyChooseItem,
  // Stats
  getAllStats,
  createStat,
  updateStat,
  deleteStat,
  // Core Values
  getAllCoreValues,
  createCoreValue,
  updateCoreValue,
  deleteCoreValue,
};
