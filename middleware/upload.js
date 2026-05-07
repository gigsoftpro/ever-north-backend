const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  process.env.UPLOAD_DIR || "uploads",
);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = (
  process.env.ALLOWED_MIME_TYPES ||
  "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
)
  .split(",")
  .map((t) => t.trim());

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

// ─── Mime → correct extension map ────────────────────────────────────────────
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

// Formats that carry an alpha channel — must NEVER go through .jpeg()
const TRANSPARENT_MIMES = new Set(["image/png", "image/webp", "image/svg+xml"]);

// ─── Multer (memory storage — we handle writing ourselves) ───────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(
          new Error(
            `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED.join(", ")}`,
          ),
          false,
        );
  },
  limits: { fileSize: MAX_SIZE },
});

// ─── Core processing ─────────────────────────────────────────────────────────
async function processAndSave(
  buffer,
  originalName,
  mimetype,
  section = "general",
) {
  // Always use the correct extension for the actual mime type
  const ext =
    MIME_TO_EXT[mimetype] || path.extname(originalName).toLowerCase() || ".jpg";
  const filename = `${uuidv4()}${ext}`;

  // Save inside section subfolder so deleteMedia can find it
  const sectionDir = path.join(UPLOAD_DIR, section);
  fs.mkdirSync(sectionDir, { recursive: true });
  const filePath = path.join(sectionDir, filename);

  // ── SVG — never touch with Sharp, raw bytes only ──────────────────────────
  if (mimetype === "image/svg+xml") {
    fs.writeFileSync(filePath, buffer);
  }

  // ── GIF — no Sharp (it strips animation), raw bytes ──────────────────────
  else if (mimetype === "image/gif") {
    fs.writeFileSync(filePath, buffer);
  }

  // ── PNG / WebP — preserve alpha, output as PNG ────────────────────────────
  else if (TRANSPARENT_MIMES.has(mimetype)) {
    await sharp(buffer)
      .resize({ width: 2400, withoutEnlargement: true, fit: "inside" })
      // ✅ ensureAlpha keeps the alpha channel intact
      .ensureAlpha()
      // ✅ .png() — never .jpeg() here
      .png({ compressionLevel: 8, adaptiveFiltering: true })
      .toFile(filePath);
  }

  // ── JPEG / everything else — no alpha, JPEG is fine ──────────────────────
  else {
    await sharp(buffer)
      .resize({ width: 2400, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);
  }

  const stat = fs.statSync(filePath);
  return { filename, filePath, size: stat.size };
}

// ─── Middleware factory ───────────────────────────────────────────────────────
function uploadSingle(fieldName = "image") {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const section = req.body.section || "general";
        const { filename, filePath, size } = await processAndSave(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          section,
        );

        // ✅ Shape unchanged — mediaController.js needs zero changes
        req.uploadedFile = {
          filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size,
          path: `/uploads/${section}/${filename}`,
        };

        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

module.exports = { uploadSingle, UPLOAD_DIR };
