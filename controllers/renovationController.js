// controllers/renovationController.js
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

async function getRenovationPage(req, res, next) {
  try {
    const [[meta]] = await pool.execute(
      "SELECT * FROM renovation_page LIMIT 1",
    );

    // Attach all image fields
    await attachMedia(req, meta, "hero_image");
    await attachMedia(req, meta, "upgrades_image");
    await attachMedia(req, meta, "why_image");
    await attachMedia(req, meta, "done_image");
    await attachMedia(req, meta, "faq_image");

    const [cards] = await pool.execute(
      "SELECT * FROM renovation_cards      ORDER BY sort_order ASC",
    );
    const [ownerTypes] = await pool.execute(
      "SELECT * FROM renovation_owner_types ORDER BY sort_order ASC",
    );
    const [whyItems] = await pool.execute(
      "SELECT * FROM renovation_why_items   ORDER BY sort_order ASC",
    );
    const [faq] = await pool.execute(
      "SELECT * FROM renovation_faq         ORDER BY sort_order ASC",
    );

    res.json({
      success: true,
      data: { meta, cards, owner_types: ownerTypes, why_items: whyItems, faq },
    });
  } catch (err) {
    next(err);
  }
}

async function updateRenovationPage(req, res, next) {
  try {
    const {
      hero_image_id,
      hero_title,
      hero_tagline,
      hero_para_1,
      hero_para_2,
      hero_para_3,
      hero_cta_text,
      hero_cta_href,
      renovate_title,
      renovate_subtitle,
      upgrades_title,
      upgrades_subtitle,
      upgrades_image_id,
      why_image_id,
      why_title,
      done_title,
      done_para_1,
      done_para_2,
      done_btn1_text,
      done_btn1_href,
      done_btn2_text,
      done_btn2_href,
      done_image_id,
      faq_title,
      faq_image_id,
    } = req.body;

    await pool.execute(
      `UPDATE renovation_page SET
        hero_image_id     = COALESCE(?, hero_image_id),
        hero_title        = COALESCE(?, hero_title),
        hero_tagline      = COALESCE(?, hero_tagline),
        hero_para_1       = COALESCE(?, hero_para_1),
        hero_para_2       = COALESCE(?, hero_para_2),
        hero_para_3       = COALESCE(?, hero_para_3),
        hero_cta_text     = COALESCE(?, hero_cta_text),
        hero_cta_href     = COALESCE(?, hero_cta_href),
        renovate_title    = COALESCE(?, renovate_title),
        renovate_subtitle = COALESCE(?, renovate_subtitle),
        upgrades_title    = COALESCE(?, upgrades_title),
        upgrades_subtitle = COALESCE(?, upgrades_subtitle),
        upgrades_image_id = COALESCE(?, upgrades_image_id),
        why_image_id      = COALESCE(?, why_image_id),
        why_title         = COALESCE(?, why_title),
        done_title        = COALESCE(?, done_title),
        done_para_1       = COALESCE(?, done_para_1),
        done_para_2       = COALESCE(?, done_para_2),
        done_btn1_text    = COALESCE(?, done_btn1_text),
        done_btn1_href    = COALESCE(?, done_btn1_href),
        done_btn2_text    = COALESCE(?, done_btn2_text),
        done_btn2_href    = COALESCE(?, done_btn2_href),
        done_image_id     = COALESCE(?, done_image_id),
        faq_title         = COALESCE(?, faq_title),
        faq_image_id      = COALESCE(?, faq_image_id)
       WHERE id = 1`,
      [
        hero_image_id ?? null,
        hero_title,
        hero_tagline,
        hero_para_1,
        hero_para_2,
        hero_para_3,
        hero_cta_text,
        hero_cta_href,
        renovate_title,
        renovate_subtitle,
        upgrades_title,
        upgrades_subtitle,
        upgrades_image_id ?? null,
        why_image_id ?? null,
        why_title,
        done_title,
        done_para_1,
        done_para_2,
        done_btn1_text,
        done_btn1_href,
        done_btn2_text,
        done_btn2_href,
        done_image_id ?? null,
        faq_title,
        faq_image_id ?? null,
      ],
    );
    res.json({ success: true, message: "Renovation page updated" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENOVATION CARDS  (What We Renovate)
// ═══════════════════════════════════════════════════════════════════════════════

async function getCards(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM renovation_cards ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createCard(req, res, next) {
  try {
    const { emoji, title, description, sort_order } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    const [r] = await pool.execute(
      "INSERT INTO renovation_cards (emoji, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [emoji || "🏠", title, description || "", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_cards WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateCard(req, res, next) {
  try {
    const { id } = req.params;
    const { emoji, title, description, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE renovation_cards SET
        emoji       = COALESCE(?, emoji),
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [emoji, title, description, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_cards WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteCard(req, res, next) {
  try {
    await pool.execute("DELETE FROM renovation_cards WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER TYPES  (Strategic Upgrades)
// ═══════════════════════════════════════════════════════════════════════════════

async function getOwnerTypes(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM renovation_owner_types ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createOwnerType(req, res, next) {
  try {
    const { title, description, sort_order } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    const [r] = await pool.execute(
      "INSERT INTO renovation_owner_types (title, description, sort_order) VALUES (?, ?, ?)",
      [title, description || "", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_owner_types WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateOwnerType(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE renovation_owner_types SET
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [title, description, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_owner_types WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteOwnerType(req, res, next) {
  try {
    await pool.execute("DELETE FROM renovation_owner_types WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY ITEMS  (bullet list)
// ═══════════════════════════════════════════════════════════════════════════════

async function getWhyItems(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM renovation_why_items ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createWhyItem(req, res, next) {
  try {
    const { text, sort_order } = req.body;
    if (!text)
      return res
        .status(400)
        .json({ success: false, message: "text is required" });
    const [r] = await pool.execute(
      "INSERT INTO renovation_why_items (text, sort_order) VALUES (?, ?)",
      [text, sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_why_items WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateWhyItem(req, res, next) {
  try {
    const { id } = req.params;
    const { text, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE renovation_why_items SET
        text       = COALESCE(?, text),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [text, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_why_items WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteWhyItem(req, res, next) {
  try {
    await pool.execute("DELETE FROM renovation_why_items WHERE id = ?", [
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

async function getFaq(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM renovation_faq ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createFaqItem(req, res, next) {
  try {
    const { question, answer, sort_order } = req.body;
    if (!question)
      return res
        .status(400)
        .json({ success: false, message: "question is required" });
    const [r] = await pool.execute(
      "INSERT INTO renovation_faq (question, answer, sort_order) VALUES (?, ?, ?)",
      [question, answer || "", sort_order ?? 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_faq WHERE id = ?",
      [r.insertId],
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function updateFaqItem(req, res, next) {
  try {
    const { id } = req.params;
    const { question, answer, sort_order, is_active } = req.body;
    await pool.execute(
      `UPDATE renovation_faq SET
        question   = COALESCE(?, question),
        answer     = COALESCE(?, answer),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [question, answer, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM renovation_faq WHERE id = ?",
      [id],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteFaqItem(req, res, next) {
  try {
    await pool.execute("DELETE FROM renovation_faq WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRenovationPage,
  updateRenovationPage,
  getCards,
  createCard,
  updateCard,
  deleteCard,
  getOwnerTypes,
  createOwnerType,
  updateOwnerType,
  deleteOwnerType,
  getWhyItems,
  createWhyItem,
  updateWhyItem,
  deleteWhyItem,
  getFaq,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
};
