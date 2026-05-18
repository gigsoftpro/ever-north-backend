// routes/pages.js
// Mount in server.js:  app.use('/api/pages', require('./routes/pages'));

const router = require("express").Router();
const c = require("../controllers/pagesController");
const { protect } = require("../middleware/auth");

// ─── Public (frontend reads) ──────────────────────────────────────────────────
router.get("/contact", c.getContactPage);
router.get("/about", c.getAboutPage);
router.get("/about/why-choose", c.getAllWhyChooseItems);
router.get("/about/stats", c.getAllStats);
router.get("/about/values", c.getAllCoreValues);

// ─── Protected (admin writes) ─────────────────────────────────────────────────
router.use(protect);

// Contact page
router.put("/contact", c.updateContactPage);

// About page meta
router.put("/about", c.updateAboutPage);

// Why Choose Items — CRUD
router.post("/about/why-choose", c.createWhyChooseItem);
router.put("/about/why-choose/:id", c.updateWhyChooseItem);
router.delete("/about/why-choose/:id", c.deleteWhyChooseItem);

// Stats — CRUD
router.post("/about/stats", c.createStat);
router.put("/about/stats/:id", c.updateStat);
router.delete("/about/stats/:id", c.deleteStat);

// Core Values — CRUD
router.post("/about/values", c.createCoreValue);
router.put("/about/values/:id", c.updateCoreValue);
router.delete("/about/values/:id", c.deleteCoreValue);

module.exports = router;
