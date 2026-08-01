// backend/utils/mailer.js
//
// FIX (real root cause, not a bug): switched from Gmail SMTP (nodemailer)
// to Resend's HTTP API. Render's free tier blocks ALL outbound SMTP
// traffic (ports 25/465/587) as of Sept 2025 - this is a platform-level
// network block, not something any code change could work around. Resend
// sends over regular HTTPS, which isn't blocked, so this actually works
// on a free Render instance.
//
// Same exported functions as before (sendEmail, isMailerConfigured), so
// nothing else in the codebase needed to change - utils/alertEmail.js and
// routes/auth.js both just keep calling these two functions exactly as
// before.
//
// REQUIRED ENV VAR: RESEND_API_KEY (free - sign up at https://resend.com,
// free tier is 3,000 emails/month, no card required).
//
// NOTE: without verifying your own domain on Resend, the "from" address
// must be Resend's shared sandbox address (onboarding@resend.dev) - this
// works fine for sending, but Resend's free/unverified tier may restrict
// WHO you can send to (often just the email you signed up with) until a
// domain is verified. If real users stop receiving mail while this is
// still on the sandbox sender, that's the next thing to check - it's a
// Resend account setting, not a bug here either.

let warnedMissingConfig = false;

export function isMailerConfigured() {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Sends a plain-text email via Resend's HTTP API. Returns true on success,
 * false if not configured or sending failed - callers should handle false
 * gracefully (e.g. still show the OTP in a dev-only response) rather than
 * crash.
 */
export async function sendEmail({ to, subject, text }) {
  if (!isMailerConfigured()) {
    if (!warnedMissingConfig) {
      console.warn("⚠ RESEND_API_KEY not set - email sending is disabled");
      warnedMissingConfig = true;
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Emovra <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
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
