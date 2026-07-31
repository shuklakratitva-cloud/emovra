// utils/alertEmail.js
// Sends a notification email when Gemini becomes unavailable, instead of
// taking the whole site offline. Taking the site down during an AI outage
// would also remove access to the SOS button, Tele-MANAS numbers, and
// grounding exercises - exactly what someone in crisis might need most, so
// the app keeps running on the local fallback classifier (see
// utils/localRiskFallback.js) and just pages you instead.
//
// REQUIRED ENV VARS (set these in Render):
//   EMAIL_USER            - a Gmail address to send FROM
//   EMAIL_APP_PASSWORD    - a Gmail "app password" (not your normal password -
//                            generate one at https://myaccount.google.com/apppasswords)
//   ADMIN_ALERT_EMAIL      - optional, defaults to shukla.kratitva@gmail.com
//
// If these aren't set, this silently no-ops (logs a warning once) rather
// than crashing the server - email alerting is a nice-to-have, not
// something that should ever take down the app.

import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "shukla.kratitva@gmail.com";

let transporter = null;
let warnedMissingConfig = false;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    if (!warnedMissingConfig) {
      console.warn("⚠ EMAIL_USER/EMAIL_APP_PASSWORD not set - Gemini-down email alerts are disabled");
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

// Simple cooldown so a sustained outage sends one email, not one per request.
let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export async function alertGeminiDown(reason) {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) return; // already alerted recently

  const t = getTransporter();
  if (!t) return;

  lastAlertSentAt = now;

  try {
    await t.sendMail({
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: "🚨 Emovra: Gemini AI is unreachable",
      text: `Gemini stopped responding at ${new Date().toISOString()}.\n\nReason: ${reason}\n\nThe app is still running on its local fallback classifier - RED/ORANGE detection keeps working conservatively, but AI-quality classification is degraded until this is resolved. Check your Gemini API quota/billing at https://aistudio.google.com/`,
    });
    console.log(`[ALERT-EMAIL] Sent Gemini-down notice to ${ADMIN_EMAIL}`);
  } catch (e) {
    console.error("Failed to send Gemini-down alert email:", e.message);
  }
}
