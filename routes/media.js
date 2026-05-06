const router = require('express').Router();
const { uploadMedia, listMedia, deleteMedia } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', listMedia);

router.use(protect);

router.post('/', uploadSingle('image'), uploadMedia);

router.delete('/:id', deleteMedia);

module.exports = router;
