// backend/utils/mailer.js
//
// Switched from Resend to Brevo. Resend's free/unverified tier only
// allows sending to the account owner's own email address until a real
// domain is verified - since this account doesn't have one yet, real
// signups were silently failing to receive their emails. Brevo's "Single
// Sender Verification" allows sending to anyone once you verify one real
// email address you own (a 6-digit code, not a domain) - no domain
// purchase required. Brevo also sends over regular HTTPS, same as
// Resend did, so this still works on Render's free tier (which blocks
// outbound SMTP traffic, but not HTTPS).
//
// Same exported functions as before (sendEmail, isMailerConfigured), so
// nothing else in the codebase needed to change - utils/alertEmail.js and
// routes/auth.js both just keep calling these two functions exactly as
// before.
//
// REQUIRED ENV VARS:
//   BREVO_API_KEY - free account at https://brevo.com, then
//     Profile menu -> SMTP & API -> API Keys -> Generate a new API key
//   BREVO_SENDER_EMAIL - the email address you verified as a Sender in
//     Brevo (Profile menu -> Senders, Domains & Dedicated IPs -> Senders
//     -> Add a sender -> verify with the 6-digit code they email you).
//     This does NOT need to be a domain you own - any real email address
//     you can receive that verification code at works, e.g. your own Gmail.

let warnedMissingConfig = false;

export function isMailerConfigured() {
  return !!(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

/**
 * Sends a plain-text email via Brevo's HTTP API. Returns true on success,
 * false if not configured or sending failed - callers should handle false
 * gracefully (e.g. still show the OTP in a dev-only response) rather than
 * crash.
 */
export async function sendEmail({ to, subject, text }) {
  if (!isMailerConfigured()) {
    if (!warnedMissingConfig) {
      console.warn("⚠ BREVO_API_KEY or BREVO_SENDER_EMAIL not set - email sending is disabled");
      warnedMissingConfig = true;
    }
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Emovra", email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("sendEmail failed:", res.status, errBody.slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendEmail failed:", e.message);
    return false;
  }
}
