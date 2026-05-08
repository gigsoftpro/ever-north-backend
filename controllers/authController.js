const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");
const { sendPasswordResetEmail } = require("../services/mailer");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function safeAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name || null,
    role: admin.role || "admin",
  };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1",
      [username, username],
    );
    const admin = rows[0];
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(admin.id);
    res.json({ success: true, token, admin: safeAdmin(admin) });
  } catch (err) {
    next(err);
  }
}

// ─── ME ───────────────────────────────────────────────────────────────────────

async function me(req, res) {
  res.json({ success: true, admin: req.admin });
}

// ─── UPDATE PROFILE (name + email) ───────────────────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    if (!email?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check email not taken by another admin
    const [taken] = await pool.execute(
      "SELECT id FROM admins WHERE email = ? AND id != ?",
      [email.trim(), req.admin.id],
    );
    if (taken.length) {
      return res
        .status(409)
        .json({ success: false, message: "Email already in use" });
    }

    await pool.execute("UPDATE admins SET name = ?, email = ? WHERE id = ?", [
      name?.trim() || null,
      email.trim(),
      req.admin.id,
    ]);

    const [rows] = await pool.execute("SELECT * FROM admins WHERE id = ?", [
      req.admin.id,
    ]);
    res.json({
      success: true,
      message: "Profile updated",
      admin: safeAdmin(rows[0]),
    });
  } catch (err) {
    next(err);
  }
}

// ─── CHANGE PASSWORD (logged-in) ──────────────────────────────────────────────

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Both passwords required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const [rows] = await pool.execute(
      "SELECT password_hash FROM admins WHERE id = ?",
      [req.admin.id],
    );
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute("UPDATE admins SET password_hash = ? WHERE id = ?", [
      hash,
      req.admin.id,
    ]);
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
}

// ─── FORGOT PASSWORD — send OTP + encrypted link ─────────────────────────────

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE email = ? LIMIT 1",
      [email.trim()],
    );

    if (!rows.length) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const admin = rows[0];

    // Invalidate any existing unused tokens
    await pool.execute(
      "UPDATE password_reset_tokens SET used = 1 WHERE admin_id = ? AND used = 0",
      [admin.id],
    );

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    // Generate & encrypt token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(
      process.env.JWT_SECRET,
      "ever-north-salt",
      32,
    );
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(rawToken, "utf8"),
      cipher.final(),
    ]);
    const tokenInUrl = iv.toString("hex") + ":" + encrypted.toString("hex");

    // ✅ FIX: let MySQL calculate expires_at using its own NOW()
    // This avoids Node.js ↔ MySQL timezone mismatch entirely
    await pool.execute(
      `INSERT INTO password_reset_tokens
         (admin_id, token, otp, otp_hash, expires_at)
       VALUES
         (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
      [admin.id, rawToken, otp, otpHash],
    );

    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${encodeURIComponent(tokenInUrl)}`;

    await sendPasswordResetEmail({
      to: admin.email,
      name: admin.name || admin.username,
      resetUrl,
      otp,
    });

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────

async function verifyOtp(req, res, next) {
  try {
    const { token: tokenInUrl, otp } = req.body;
    if (!tokenInUrl || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Token and OTP are required" });
    }

    const rawToken = decryptToken(tokenInUrl);
    if (!rawToken) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or malformed token" });
    }

    // ✅ FIX: compare with NOW() — same clock that wrote expires_at
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [rawToken],
    );

    if (!rows.length) {
      // Distinguish expired vs never-existed for easier debugging
      const [anyRows] = await pool.execute(
        "SELECT used, expires_at FROM password_reset_tokens WHERE token = ? LIMIT 1",
        [rawToken],
      );
      if (!anyRows.length) {
        return res.status(400).json({
          success: false,
          message: "Token not found. Please request a new reset link.",
        });
      }
      if (anyRows[0].used) {
        return res.status(400).json({
          success: false,
          message: "This reset link has already been used.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Reset link has expired. Please request a new one.",
      });
    }

    const record = rows[0];
    const otpMatch = await bcrypt.compare(String(otp).trim(), record.otp_hash);
    if (!otpMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please check your email.",
      });
    }

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    next(err);
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

async function resetPassword(req, res, next) {
  try {
    const { token: tokenInUrl, otp, newPassword } = req.body;
    if (!tokenInUrl || !otp || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Token, OTP and new password are required",
        });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters",
        });
    }

    const rawToken = decryptToken(tokenInUrl);
    if (!rawToken) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or malformed token" });
    }

    // ✅ FIX: same NOW() clock
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [rawToken],
    );

    if (!rows.length) {
      const [anyRows] = await pool.execute(
        "SELECT used FROM password_reset_tokens WHERE token = ? LIMIT 1",
        [rawToken],
      );
      if (anyRows[0]?.used) {
        return res
          .status(400)
          .json({
            success: false,
            message: "This reset link has already been used.",
          });
      }
      return res
        .status(400)
        .json({
          success: false,
          message: "Reset link has expired. Please request a new one.",
        });
    }

    const record = rows[0];
    const otpMatch = await bcrypt.compare(String(otp).trim(), record.otp_hash);
    if (!otpMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect OTP." });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute("UPDATE admins SET password_hash = ? WHERE id = ?", [
      hash,
      record.admin_id,
    ]);

    await pool.execute(
      "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
      [record.id],
    );

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Decrypt helper ───────────────────────────────────────────────────────────

function decryptToken(tokenInUrl) {
  try {
    const [ivHex, encHex] = tokenInUrl.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encHex, "hex");
    const key = crypto.scryptSync(
      process.env.JWT_SECRET,
      "ever-north-salt",
      32,
    );
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

module.exports = {
  login,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
