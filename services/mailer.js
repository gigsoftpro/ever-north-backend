const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail({ to, name, resetUrl, otp }) {
  await transporter.sendMail({
    from: `"Ever North CMS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Password Reset — Ever North CMS",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;font-family:sans-serif;background:#f8fafc">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#8f7334,#b7a170);padding:32px 40px">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">Ever North CMS</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Password Reset Request</p>
          </div>
          <div style="padding:40px">
            <p style="color:#334155;font-size:15px;margin:0 0 16px">Hi ${name || "Admin"},</p>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
              We received a request to reset your password. Use the OTP below along with the reset link. 
              Both expire in <strong>15 minutes</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background:#fefce8;border:2px dashed #b7a170;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
              <p style="margin:0 0 8px;color:#78716c;font-size:12px;text-transform:uppercase;letter-spacing:2px">Your OTP</p>
              <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#8f7334">${otp}</p>
            </div>

            <!-- Reset Button -->
            <a href="${resetUrl}" style="display:block;background:linear-gradient(0deg,#8f7334,#b7a170);color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;margin:0 0 24px">
              Reset My Password
            </a>

            <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
              If you didn't request this, ignore this email — your password won't change.<br>
              For security, this link is single-use and expires in 15 minutes.
            </p>
          </div>
          <div style="padding:20px 40px;border-top:1px solid #f1f5f9;background:#f8fafc">
            <p style="margin:0;color:#cbd5e1;font-size:11px">Ever North Property Management CMS · Secure Admin Portal</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
