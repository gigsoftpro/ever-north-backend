require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { testConnection } = require("./config/db");
const authRoutes = require("./routes/auth");
const mediaRoutes = require("./routes/media");
const contentRoutes = require("./routes/content");
const pagesRoute = require("./routes/pages");
const renovationRoute = require("./routes/renovation");
const services = require("./routes/services");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

const ApiVersion = "/api/v1/";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5174 ")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});
app.use(`${ApiVersion}auth/login`, loginLimiter);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: { success: false, message: "Too many requests. Please slow down." },
});

app.use("/api", apiLimiter);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
  }),
);

app.use(`${ApiVersion}auth`, authRoutes);
app.use(`${ApiVersion}media`, mediaRoutes);
app.use(`${ApiVersion}content`, contentRoutes);
app.use(`${ApiVersion}pages`, pagesRoute);
app.use(`${ApiVersion}renovation`, renovationRoute);
app.use(`${ApiVersion}services`, services);

app.get(`${ApiVersion}health`, (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

async function start() {
  await testConnection();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\nEver North API running on:`);

    console.log(`- Local:    http://localhost:${PORT}`);
    console.log(`- Network:  http://192.168.1.7:${PORT}`);

    console.log(`Uploads served at http://localhost:${PORT}/uploads`);
    console.log(`Frontend origin: ${allowedOrigins.join(", ")}\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
