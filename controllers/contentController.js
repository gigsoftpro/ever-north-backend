const { pool } = require("../config/db");

// ─── Helper ──────────────────────────────────────────────────────────────────
function mediaUrl(req, filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${req.protocol}://${req.get("host")}${filePath}`;
}

async function attachMedia(req, row, ...fields) {
  if (!row) return row;
  for (const field of fields) {
    const idField = `${field}_id`;
    if (row[idField]) {
      const [rows] = await pool.execute("SELECT * FROM media WHERE id = ?", [
        row[idField],
      ]);
      row[field] = rows[0]
        ? { ...rows[0], url: mediaUrl(req, rows[0].path) }
        : null;
    }
  }
  return row;
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

async function getHero(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM hero_section LIMIT 1");
    const data = await attachMedia(req, row, "bg_image", "overlay_image");
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateHero(req, res, next) {
  try {
    const { title, highlighted_word, cta_text, bg_image_id, overlay_image_id } =
      req.body;
    await pool.execute(
      `UPDATE hero_section SET
        title = COALESCE(?, title),
        highlighted_word = COALESCE(?, highlighted_word),
        cta_text = COALESCE(?, cta_text),
        bg_image_id = COALESCE(?, bg_image_id),
        overlay_image_id = COALESCE(?, overlay_image_id)
       WHERE id = 1`,
      [
        title,
        highlighted_word,
        cta_text,
        bg_image_id ?? null,
        overlay_image_id ?? null,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM hero_section LIMIT 1");
    const data = await attachMedia(req, row, "bg_image", "overlay_image");
    res.json({ success: true, message: "Hero updated", data });
  } catch (err) {
    next(err);
  }
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────

async function getAbout(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM about_section LIMIT 1");
    const data = await attachMedia(req, row, "about_image");
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateAbout(req, res, next) {
  try {
    const {
      about_image_id,
      mission_badge,
      mission_text_1,
      mission_text_2,
      about_badge,
      about_text_1,
      about_text_2,
      about_text_3,
      services_label,
    } = req.body;

    await pool.execute(
      `UPDATE about_section SET
        about_image_id   = COALESCE(?, about_image_id),
        mission_badge    = COALESCE(?, mission_badge),
        mission_text_1   = COALESCE(?, mission_text_1),
        mission_text_2   = COALESCE(?, mission_text_2),
        about_badge      = COALESCE(?, about_badge),
        about_text_1     = COALESCE(?, about_text_1),
        about_text_2     = COALESCE(?, about_text_2),
        about_text_3     = COALESCE(?, about_text_3),
        services_label   = COALESCE(?, services_label)
       WHERE id = 1`,
      [
        about_image_id ?? null,
        mission_badge,
        mission_text_1,
        mission_text_2,
        about_badge,
        about_text_1,
        about_text_2,
        about_text_3,
        services_label,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM about_section LIMIT 1");
    const data = await attachMedia(req, row, "about_image");
    res.json({ success: true, message: "About updated", data });
  } catch (err) {
    next(err);
  }
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

async function getServices(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM services ORDER BY sort_order ASC",
    );
    const data = await Promise.all(
      rows.map((r) => attachMedia(req, r, "image")),
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createService(req, res, next) {
  try {
    const { title, description, image_id, style, sort_order } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    const [result] = await pool.execute(
      "INSERT INTO services (title, description, image_id, style, sort_order) VALUES (?, ?, ?, ?, ?)",
      [
        title,
        description || null,
        image_id || null,
        style || "full-text",
        sort_order || 0,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM services WHERE id = ?", [
      result.insertId,
    ]);
    const data = await attachMedia(req, row, "image");
    res.status(201).json({ success: true, message: "Service created", data });
  } catch (err) {
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, image_id, style, sort_order, is_active } =
      req.body;
    const [existing] = await pool.execute(
      "SELECT id FROM services WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    await pool.execute(
      `UPDATE services SET
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        image_id    = COALESCE(?, image_id),
        style       = COALESCE(?, style),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        title,
        description,
        image_id ?? null,
        style,
        sort_order,
        is_active ?? null,
        id,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM services WHERE id = ?", [
      id,
    ]);
    const data = await attachMedia(req, row, "image");
    res.json({ success: true, message: "Service updated", data });
  } catch (err) {
    next(err);
  }
}

async function deleteService(req, res, next) {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM services WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    await pool.execute("DELETE FROM services WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── CLEANING SERVICES ────────────────────────────────────────────────────────

async function getCleaningSection(req, res, next) {
  try {
    const [[meta]] = await pool.execute(
      "SELECT * FROM cleaning_section_meta LIMIT 1",
    );
    const [items] = await pool.execute(
      "SELECT * FROM cleaning_services ORDER BY sort_order ASC",
    );
    const itemsWithMedia = await Promise.all(
      items.map((r) => attachMedia(req, r, "image")),
    );
    res.json({ success: true, data: { meta, items: itemsWithMedia } });
  } catch (err) {
    next(err);
  }
}

async function updateCleaningMeta(req, res, next) {
  try {
    const { title, description } = req.body;
    await pool.execute(
      "UPDATE cleaning_section_meta SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = 1",
      [title, description],
    );
    const [[meta]] = await pool.execute(
      "SELECT * FROM cleaning_section_meta LIMIT 1",
    );
    res.json({ success: true, message: "Cleaning meta updated", data: meta });
  } catch (err) {
    next(err);
  }
}

async function createCleaningItem(req, res, next) {
  try {
    const { label, description, image_id, sort_order } = req.body;
    if (!label)
      return res
        .status(400)
        .json({ success: false, message: "label is required" });

    const [result] = await pool.execute(
      "INSERT INTO cleaning_services (label, description, image_id, sort_order) VALUES (?, ?, ?, ?)",
      [label, description || null, image_id || null, sort_order || 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM cleaning_services WHERE id = ?",
      [result.insertId],
    );
    const data = await attachMedia(req, row, "image");
    res.status(201).json({ success: true, message: "Item created", data });
  } catch (err) {
    next(err);
  }
}

async function updateCleaningItem(req, res, next) {
  try {
    const { id } = req.params;
    const { label, description, image_id, sort_order, is_active } = req.body;

    const [existing] = await pool.execute(
      "SELECT id FROM cleaning_services WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    await pool.execute(
      `UPDATE cleaning_services SET
        label       = COALESCE(?, label),
        description = COALESCE(?, description),
        image_id    = COALESCE(?, image_id),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        label,
        description ?? null,
        image_id ?? null,
        sort_order,
        is_active ?? null,
        id,
      ],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM cleaning_services WHERE id = ?",
      [id],
    );
    const data = await attachMedia(req, row, "image");
    res.json({ success: true, message: "Item updated", data });
  } catch (err) {
    next(err);
  }
}

async function deleteCleaningItem(req, res, next) {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM cleaning_services WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    await pool.execute("DELETE FROM cleaning_services WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────

async function getMaintenanceSection(req, res, next) {
  try {
    const [[meta]] = await pool.execute(
      "SELECT * FROM maintenance_section LIMIT 1",
    );
    const [items] = await pool.execute(
      "SELECT * FROM maintenance_items ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: { meta, items } });
  } catch (err) {
    next(err);
  }
}

async function updateMaintenanceMeta(req, res, next) {
  try {
    const { heading, cta_label } = req.body;
    await pool.execute(
      "UPDATE maintenance_section SET heading = COALESCE(?, heading), cta_label = COALESCE(?, cta_label) WHERE id = 1",
      [heading, cta_label],
    );
    const [[meta]] = await pool.execute(
      "SELECT * FROM maintenance_section LIMIT 1",
    );
    res.json({
      success: true,
      message: "Maintenance meta updated",
      data: meta,
    });
  } catch (err) {
    next(err);
  }
}

async function createMaintenanceItem(req, res, next) {
  try {
    const { title, description, sort_order } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    const [result] = await pool.execute(
      "INSERT INTO maintenance_items (title, description, sort_order) VALUES (?, ?, ?)",
      [title, description || null, sort_order || 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM maintenance_items WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json({ success: true, message: "Item created", data: row });
  } catch (err) {
    next(err);
  }
}

async function updateMaintenanceItem(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, sort_order, is_active } = req.body;
    const [existing] = await pool.execute(
      "SELECT id FROM maintenance_items WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    await pool.execute(
      `UPDATE maintenance_items SET
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [title, description, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM maintenance_items WHERE id = ?",
      [id],
    );
    res.json({ success: true, message: "Item updated", data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteMaintenanceItem(req, res, next) {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM maintenance_items WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    await pool.execute("DELETE FROM maintenance_items WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── AREAS ────────────────────────────────────────────────────────────────────

async function getAreasSection(req, res, next) {
  try {
    const [[meta]] = await pool.execute(
      "SELECT * FROM areas_section_meta LIMIT 1",
    );
    const [rows] = await pool.execute(
      "SELECT * FROM areas ORDER BY sort_order ASC",
    );
    const areas = await Promise.all(
      rows.map((r) => attachMedia(req, r, "image")),
    );
    res.json({ success: true, data: { meta, areas } });
  } catch (err) {
    next(err);
  }
}

async function updateAreasMeta(req, res, next) {
  try {
    const { title, subtitle } = req.body;
    await pool.execute(
      "UPDATE areas_section_meta SET title = COALESCE(?, title), subtitle = COALESCE(?, subtitle) WHERE id = 1",
      [title, subtitle],
    );
    const [[meta]] = await pool.execute(
      "SELECT * FROM areas_section_meta LIMIT 1",
    );
    res.json({ success: true, message: "Areas meta updated", data: meta });
  } catch (err) {
    next(err);
  }
}

async function createArea(req, res, next) {
  try {
    const { name, image_id, sort_order } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    const [result] = await pool.execute(
      "INSERT INTO areas (name, image_id, sort_order) VALUES (?, ?, ?)",
      [name, image_id || null, sort_order || 0],
    );
    const [[row]] = await pool.execute("SELECT * FROM areas WHERE id = ?", [
      result.insertId,
    ]);
    const data = await attachMedia(req, row, "image");
    res.status(201).json({ success: true, message: "Area created", data });
  } catch (err) {
    next(err);
  }
}

async function updateArea(req, res, next) {
  try {
    const { id } = req.params;
    const { name, image_id, sort_order, is_active } = req.body;
    const [existing] = await pool.execute("SELECT id FROM areas WHERE id = ?", [
      id,
    ]);
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    await pool.execute(
      `UPDATE areas SET
        name       = COALESCE(?, name),
        image_id   = COALESCE(?, image_id),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, image_id ?? null, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute("SELECT * FROM areas WHERE id = ?", [
      id,
    ]);
    const data = await attachMedia(req, row, "image");
    res.json({ success: true, message: "Area updated", data });
  } catch (err) {
    next(err);
  }
}

async function deleteArea(req, res, next) {
  try {
    const [existing] = await pool.execute("SELECT id FROM areas WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    await pool.execute("DELETE FROM areas WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Area deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

async function getTestimonials(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getAllTestimonials(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM testimonials ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createTestimonial(req, res, next) {
  try {
    const { customer_name, quote, rating, sort_order } = req.body;
    if (!customer_name || !quote) {
      return res
        .status(400)
        .json({ success: false, message: "customer_name and quote required" });
    }
    const [result] = await pool.execute(
      "INSERT INTO testimonials (customer_name, quote, rating, sort_order) VALUES (?, ?, ?, ?)",
      [customer_name, quote, rating || 5, sort_order || 0],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM testimonials WHERE id = ?",
      [result.insertId],
    );
    res
      .status(201)
      .json({ success: true, message: "Testimonial created", data: row });
  } catch (err) {
    next(err);
  }
}

async function updateTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const { customer_name, quote, rating, sort_order, is_active } = req.body;
    const [existing] = await pool.execute(
      "SELECT id FROM testimonials WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    await pool.execute(
      `UPDATE testimonials SET
        customer_name = COALESCE(?, customer_name),
        quote         = COALESCE(?, quote),
        rating        = COALESCE(?, rating),
        sort_order    = COALESCE(?, sort_order),
        is_active     = COALESCE(?, is_active)
       WHERE id = ?`,
      [customer_name, quote, rating, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM testimonials WHERE id = ?",
      [id],
    );
    res.json({ success: true, message: "Testimonial updated", data: row });
  } catch (err) {
    next(err);
  }
}

async function deleteTestimonial(req, res, next) {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM testimonials WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    await pool.execute("DELETE FROM testimonials WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Testimonial deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── HEADER INFO ──────────────────────────────────────────────────────────────

async function getHeader(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM header_info LIMIT 1");
    const data = await attachMedia(req, row, "logo");
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateHeader(req, res, next) {
  try {
    const { phone, email, logo_id } = req.body;
    await pool.execute(
      "UPDATE header_info SET phone = COALESCE(?, phone), email = COALESCE(?, email), logo_id = COALESCE(?, logo_id) WHERE id = 1",
      [phone, email, logo_id ?? null],
    );
    const [[row]] = await pool.execute("SELECT * FROM header_info LIMIT 1");
    const data = await attachMedia(req, row, "logo");
    res.json({ success: true, message: "Header updated", data });
  } catch (err) {
    next(err);
  }
}

// ─── NAV LINKS ────────────────────────────────────────────────────────────────

async function getNavLinks(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM nav_links WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function updateNavLink(req, res, next) {
  try {
    const { id } = req.params;
    const { label, href, sort_order, is_active } = req.body;
    const [existing] = await pool.execute(
      "SELECT id FROM nav_links WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Nav link not found" });
    await pool.execute(
      `UPDATE nav_links SET
        label      = COALESCE(?, label),
        href       = COALESCE(?, href),
        sort_order = COALESCE(?, sort_order),
        is_active  = COALESCE(?, is_active)
       WHERE id = ?`,
      [label, href, sort_order, is_active ?? null, id],
    );
    const [[row]] = await pool.execute("SELECT * FROM nav_links WHERE id = ?", [
      id,
    ]);
    res.json({ success: true, message: "Nav link updated", data: row });
  } catch (err) {
    next(err);
  }
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

async function getFooter(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM footer_content LIMIT 1");
    const data = await attachMedia(req, row, "logo", "building_img");
    const [navLinks] = await pool.execute(
      "SELECT * FROM nav_links WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    res.json({ success: true, data: { ...data, quick_links: navLinks } });
  } catch (err) {
    next(err);
  }
}

async function updateFooter(req, res, next) {
  try {
    const {
      logo_id,
      building_img_id,
      description,
      email,
      phone,
      copyright_text,
    } = req.body;
    await pool.execute(
      `UPDATE footer_content SET
        logo_id         = COALESCE(?, logo_id),
        building_img_id = COALESCE(?, building_img_id),
        description     = COALESCE(?, description),
        email           = COALESCE(?, email),
        phone           = COALESCE(?, phone),
        copyright_text  = COALESCE(?, copyright_text)
       WHERE id = 1`,
      [
        logo_id ?? null,
        building_img_id ?? null,
        description,
        email,
        phone,
        copyright_text,
      ],
    );
    const [[row]] = await pool.execute("SELECT * FROM footer_content LIMIT 1");
    const data = await attachMedia(req, row, "logo", "building_img");
    res.json({ success: true, message: "Footer updated", data });
  } catch (err) {
    next(err);
  }
}

// ─── CONTACT SUBMISSIONS ──────────────────────────────────────────────────────

async function submitContact(req, res, next) {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "name, email, and message are required",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address" });
    }
    await pool.execute(
      "INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone || null, subject || null, message],
    );
    res.status(201).json({
      success: true,
      message: "Message received. We will be in touch soon!",
    });
  } catch (err) {
    next(err);
  }
}

async function getContactSubmissions(req, res, next) {
  try {
    let { page = "1", limit = "20", unread } = req.query;

    // Validate numbers safely
    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 20;

    const offset = (pageNum - 1) * limitNum;

    let baseQuery = "FROM contact_submissions";
    let whereClause = "";

    if (unread === "true") {
      whereClause = " WHERE is_read = 0";
    }

    // ✅ Inject LIMIT/OFFSET directly (safe because we validated)
    const dataQuery = `
      SELECT * 
      ${baseQuery}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      ${baseQuery}
      ${whereClause}
    `;

    // Debug (use once)
    // console.log(dataQuery);

    const [rows] = await pool.query(dataQuery); // 👈 use query instead of execute
    const [[{ total }]] = await pool.query(countQuery);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}

async function markContactRead(req, res, next) {
  try {
    await pool.execute(
      "UPDATE contact_submissions SET is_read = 1 WHERE id = ?",
      [req.params.id],
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    next(err);
  }
}

async function deleteContactSubmission(req, res, next) {
  try {
    await pool.execute("DELETE FROM contact_submissions WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Submission deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── HERO SLIDES ──────────────────────────────────────────────────────────────

async function getHeroSlides(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    const data = await Promise.all(
      rows.map((r) => attachMedia(req, r, "bg_image", "overlay_image")),
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAllHeroSlides(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM hero_slides ORDER BY sort_order ASC",
    );
    const data = await Promise.all(
      rows.map((r) => attachMedia(req, r, "bg_image", "overlay_image")),
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createHeroSlide(req, res, next) {
  try {
    const {
      title,
      highlighted_word,
      cta_text,
      bg_image_id,
      overlay_image_id,
      sort_order,
    } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });

    const [result] = await pool.execute(
      `INSERT INTO hero_slides (title, highlighted_word, cta_text, bg_image_id, overlay_image_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        highlighted_word || null,
        cta_text || null,
        bg_image_id || null,
        overlay_image_id || null,
        sort_order ?? 0,
      ],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM hero_slides WHERE id = ?",
      [result.insertId],
    );
    const data = await attachMedia(req, row, "bg_image", "overlay_image");
    res.status(201).json({ success: true, message: "Slide created", data });
  } catch (err) {
    next(err);
  }
}

async function updateHeroSlide(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      highlighted_word,
      cta_text,
      bg_image_id,
      overlay_image_id,
      sort_order,
      is_active,
    } = req.body;

    const [existing] = await pool.execute(
      "SELECT id FROM hero_slides WHERE id = ?",
      [id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Slide not found" });

    await pool.execute(
      `UPDATE hero_slides SET
        title            = COALESCE(?, title),
        highlighted_word = COALESCE(?, highlighted_word),
        cta_text         = COALESCE(?, cta_text),
        bg_image_id      = COALESCE(?, bg_image_id),
        overlay_image_id = COALESCE(?, overlay_image_id),
        sort_order       = COALESCE(?, sort_order),
        is_active        = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        title,
        highlighted_word,
        cta_text,
        bg_image_id ?? null,
        overlay_image_id ?? null,
        sort_order,
        is_active ?? null,
        id,
      ],
    );
    const [[row]] = await pool.execute(
      "SELECT * FROM hero_slides WHERE id = ?",
      [id],
    );
    const data = await attachMedia(req, row, "bg_image", "overlay_image");
    res.json({ success: true, message: "Slide updated", data });
  } catch (err) {
    next(err);
  }
}

async function deleteHeroSlide(req, res, next) {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM hero_slides WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Slide not found" });
    await pool.execute("DELETE FROM hero_slides WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Slide deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── CONTACT CONTENT ─────────────────────────────────────────────────────────

async function getContactContent(req, res, next) {
  try {
    const [[row]] = await pool.execute("SELECT * FROM contact_content LIMIT 1");
    const data = await attachMedia(req, row, "bg_image");
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateContactContent(req, res, next) {
  try {
    const { heading, subheading, bg_image_id } = req.body;
    await pool.execute(
      `UPDATE contact_content SET
        heading     = COALESCE(?, heading),
        subheading  = COALESCE(?, subheading),
        bg_image_id = COALESCE(?, bg_image_id)
       WHERE id = 1`,
      [heading, subheading, bg_image_id ?? null],
    );
    const [[row]] = await pool.execute("SELECT * FROM contact_content LIMIT 1");
    const data = await attachMedia(req, row, "bg_image");
    res.json({ success: true, message: "Contact content updated", data });
  } catch (err) {
    next(err);
  }
}

// ─── FULL SITE DATA (single endpoint for frontend hydration) ─────────────────

async function getSiteData(req, res, next) {
  try {
    const [[hero]] = await pool.execute("SELECT * FROM hero_section LIMIT 1");
    const [heroSlides] = await pool.execute(
      "SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    const [[about]] = await pool.execute("SELECT * FROM about_section LIMIT 1");
    const [services] = await pool.execute(
      "SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order",
    );
    const [[cleanMeta]] = await pool.execute(
      "SELECT * FROM cleaning_section_meta LIMIT 1",
    );
    const [cleanItems] = await pool.execute(
      "SELECT * FROM cleaning_services WHERE is_active = 1 ORDER BY sort_order",
    );
    const [[maintMeta]] = await pool.execute(
      "SELECT * FROM maintenance_section LIMIT 1",
    );
    const [maintItems] = await pool.execute(
      "SELECT * FROM maintenance_items WHERE is_active = 1 ORDER BY sort_order",
    );
    const [[areasMeta]] = await pool.execute(
      "SELECT * FROM areas_section_meta LIMIT 1",
    );
    const [areas] = await pool.execute(
      "SELECT * FROM areas WHERE is_active = 1 ORDER BY sort_order",
    );
    const [testimonials] = await pool.execute(
      "SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order",
    );
    const [[headerInfo]] = await pool.execute(
      "SELECT * FROM header_info LIMIT 1",
    );
    const [navLinks] = await pool.execute(
      "SELECT * FROM nav_links WHERE is_active = 1 ORDER BY sort_order",
    );
    const [[footer]] = await pool.execute(
      "SELECT * FROM footer_content LIMIT 1",
    );
    const [[contactContent]] = await pool.execute(
      "SELECT * FROM contact_content LIMIT 1",
    );

    // attach its media:
    const contactData = await attachMedia(req, contactContent, "bg_image");

    // Attach media for all image-bearing sections
    const heroData = await Promise.all(
      heroSlides.map((r) => attachMedia(req, r, "bg_image", "overlay_image")),
    );
    // const heroData = await attachMedia(req, hero, "bg_image", "overlay_image");
    const aboutData = await attachMedia(req, about, "about_image");
    const servicesData = await Promise.all(
      services.map((r) => attachMedia(req, r, "image")),
    );
    const cleanData = await Promise.all(
      cleanItems.map((r) => attachMedia(req, r, "image")),
    );
    const areasData = await Promise.all(
      areas.map((r) => attachMedia(req, r, "image")),
    );
    const headerData = await attachMedia(req, headerInfo, "logo");
    const footerData = await attachMedia(req, footer, "logo", "building_img");

    res.json({
      success: true,
      data: {
        header: { ...headerData, nav_links: navLinks },
        hero: heroData,
        about: aboutData,
        services: servicesData,
        cleaning: { meta: cleanMeta, items: cleanData },
        maintenance: { meta: maintMeta, items: maintItems },
        areas: { meta: areasMeta, areas: areasData },
        testimonials,
        contact: contactData,
        footer: { ...footerData, quick_links: navLinks },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Hero
  getHero,
  updateHero,
  // About
  getAbout,
  updateAbout,
  // Services
  getServices,
  createService,
  updateService,
  deleteService,
  // Cleaning
  getCleaningSection,
  updateCleaningMeta,
  createCleaningItem,
  updateCleaningItem,
  deleteCleaningItem,
  // Maintenance
  getMaintenanceSection,
  updateMaintenanceMeta,
  createMaintenanceItem,
  updateMaintenanceItem,
  deleteMaintenanceItem,
  // Areas
  getAreasSection,
  updateAreasMeta,
  createArea,
  updateArea,
  deleteArea,
  // Testimonials
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  // Header / Nav / Footer
  getHeader,
  updateHeader,
  getNavLinks,
  updateNavLink,
  getFooter,
  updateFooter,
  // Contact from Edit
  getContactContent,
  updateContactContent,

  // Contact
  submitContact,
  getContactSubmissions,
  markContactRead,
  deleteContactSubmission,
  // hero Section Sliders
  getHeroSlides,
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  // Full site
  getSiteData,
};
