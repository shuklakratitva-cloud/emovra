import { sendEmail } from "./mailer.js";

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "shukla.kratitva@gmail.com";

let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

export async function alertGeminiDown(reason) {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) return;
  lastAlertSentAt = now;

  const sent = await sendEmail({
    to: ADMIN_EMAIL,
    subject: "🚨 Emovra: Gemini AI is unreachable",
    text: `Gemini stopped responding at ${new Date().toISOString()}.\n\nReason: ${reason}\n\nThe app is still running on its local fallback classifier - RED/ORANGE detection keeps working conservatively, but AI-quality classification is degraded until this is resolved. Check your Gemini API quota/billing at https://aistudio.google.com/`,
  });

  if (sent) console.log(`[ALERT-EMAIL] Sent Gemini-down notice to ${ADMIN_EMAIL}`);
}
