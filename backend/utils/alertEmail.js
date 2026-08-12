// utils/alertEmail.js
// Sends a notification email when Gemini becomes unavailable, instead of
// taking the whole site offline. Taking the site down during an AI outage
// would also remove access to the SOS button, Tele-MANAS numbers, and
// grounding exercises - exactly what someone in crisis might need most, so
// the app keeps running on the local fallback classifier (see
// utils/localRiskFallback.js) and just pages you instead.
//
// REQUIRED ENV VARS (set these in Render):
//   BREVO_API_KEY, BREVO_SENDER_EMAIL - free at https://brevo.com, see
//                             utils/mailer.js for the full setup steps
//   ADMIN_ALERT_EMAIL      - optional, defaults to shukla.kratitva@gmail.com
//
// Uses the shared mailer in utils/mailer.js (Resend, HTTPS-based - not
// blocked SMTP) - same setup also powers the email OTP flow in
// routes/auth.js.

import { sendEmail } from "./mailer.js";

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "shukla.kratitva@gmail.com";

// Simple cooldown so a sustained outage sends one email, not one per request.
let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export async function alertGeminiDown(reason) {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) return; // already alerted recently
  lastAlertSentAt = now;

  const sent = await sendEmail({
    to: ADMIN_EMAIL,
    subject: "🚨 Emovra: Gemini AI is unreachable",
    text: `Gemini stopped responding at ${new Date().toISOString()}.\n\nReason: ${reason}\n\nThe app is still running on its local fallback classifier - RED/ORANGE detection keeps working conservatively, but AI-quality classification is degraded until this is resolved. Check your Gemini API quota/billing at https://aistudio.google.com/`,
  });

  if (sent) console.log(`[ALERT-EMAIL] Sent Gemini-down notice to ${ADMIN_EMAIL}`);
}
