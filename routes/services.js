// routes/services.js
// Register in server.js:  app.use('/api/services', require('./routes/services'));

const router = require("express").Router();
const c = require("../controllers/servicesController");
const { protect } = require("../middleware/auth");

// ─── Public (frontend reads) ──────────────────────────────────────────────────
router.get("/", c.getServicesPage); // full page data
router.get("/why-items", c.getWhyItems); // all why-items (optional ?section_key=)
router.get("/faq", c.getFaq); // all FAQ items

// ─── Protected (admin writes) ─────────────────────────────────────────────────
router.use(protect);

// Page meta
router.put("/", c.updateServicesPage);

// Why items CRUD
router.post("/why-items", c.createWhyItem);
router.put("/why-items/:id", c.updateWhyItem);
router.delete("/why-items/:id", c.deleteWhyItem);

// FAQ CRUD
router.post("/faq", c.createFaqItem);
router.put("/faq/:id", c.updateFaqItem);
router.delete("/faq/:id", c.deleteFaqItem);

module.exports = router;
