// routes/renovation.js
// Add to server.js:  app.use('/api/renovation', require('./routes/renovation'));

const router = require("express").Router();
const c = require("../controllers/renovationController");
const { protect } = require("../middleware/auth");

// ─── Public (frontend reads) ──────────────────────────────────────────────────
router.get("/", c.getRenovationPage); // full page data
router.get("/cards", c.getCards);
router.get("/owner-types", c.getOwnerTypes);
router.get("/why-items", c.getWhyItems);
router.get("/faq", c.getFaq);

// ─── Protected (admin writes) ─────────────────────────────────────────────────
router.use(protect);

// Page meta
router.put("/", c.updateRenovationPage);

// Cards CRUD
router.post("/cards", c.createCard);
router.put("/cards/:id", c.updateCard);
router.delete("/cards/:id", c.deleteCard);

// Owner types CRUD
router.post("/owner-types", c.createOwnerType);
router.put("/owner-types/:id", c.updateOwnerType);
router.delete("/owner-types/:id", c.deleteOwnerType);

// Why items CRUD
router.post("/why-items", c.createWhyItem);
router.put("/why-items/:id", c.updateWhyItem);
router.delete("/why-items/:id", c.deleteWhyItem);

// FAQ CRUD
router.post("/faq", c.createFaqItem);
router.put("/faq/:id", c.updateFaqItem);
router.delete("/faq/:id", c.deleteFaqItem);

module.exports = router;
