const router = require('express').Router();
const { uploadMedia, listMedia, deleteMedia } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All media routes require authentication
router.use(protect);

// POST   /api/media          — upload image
router.post('/', uploadSingle('image'), uploadMedia);

// GET    /api/media          — list all (optional ?section=hero&page=1&limit=20)
router.get('/', listMedia);

// DELETE /api/media/:id      — delete by id
router.delete('/:id', deleteMedia);

module.exports = router;
