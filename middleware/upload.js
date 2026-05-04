const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const sharp  = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed MIME types
const ALLOWED = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp,image/gif')
  .split(',')
  .map(t => t.trim());

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;

// Store files temporarily in memory, then process with sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

/**
 * Process and save image to disk after multer stores it in memory.
 * Resizes large images and converts to webp for efficiency.
 */
async function processAndSave(buffer, originalName, mimetype) {
  const ext       = path.extname(originalName).toLowerCase() || '.jpg';
  const filename  = `${uuidv4()}${ext}`;
  const filePath  = path.join(UPLOAD_DIR, filename);

  // For GIF keep as-is; for others normalise
  if (mimetype === 'image/gif') {
    fs.writeFileSync(filePath, buffer);
  } else {
    await sharp(buffer)
      .resize({ width: 2400, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);
  }

  const stat = fs.statSync(filePath);
  return { filename, filePath, size: stat.size };
}

/**
 * Middleware factory — wraps upload.single + processAndSave.
 * Attaches req.uploadedFile = { filename, path, size, originalName, mimetype }
 */
function uploadSingle(fieldName = 'image') {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next(); // no file uploaded — that's ok
      try {
        const { filename, filePath, size } = await processAndSave(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        req.uploadedFile = {
          filename,
          originalName: req.file.originalname,
          mimetype:     req.file.mimetype,
          size,
          path:         `/uploads/${filename}`,
        };
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

module.exports = { uploadSingle, UPLOAD_DIR };
