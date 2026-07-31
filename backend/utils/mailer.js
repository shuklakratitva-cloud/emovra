// backend/utils/mailer.js
// Shared Gmail-based email sender. Used by utils/alertEmail.js (Gemini-down
// admin alerts) and routes/auth.js (email OTP for password reset). Same
// free setup for both - one EMAIL_USER/EMAIL_APP_PASSWORD pair covers
// everything that needs to send an email.

import nodemailer from "nodemailer";

let transporter = null;
let warnedMissingConfig = false;

export function isMailerConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isMailerConfigured()) {
    if (!warnedMissingConfig) {
      console.warn("⚠ EMAIL_USER/EMAIL_APP_PASSWORD not set - email sending is disabled");
      warnedMissingConfig = true;
    }
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

/**
 * Sends a plain-text email. Returns true on success, false if mailer isn't
 * configured or sending failed - callers should handle false gracefully
 * (e.g. still show the OTP in a dev-only response) rather than crash.
 */
export async function sendEmail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    return true;
  } catch (e) {
    console.error("sendEmail failed:", e.message);
    return false;
  }
}
