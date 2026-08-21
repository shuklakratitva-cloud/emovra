let warnedMissingConfig = false;

export function isMailerConfigured() {
  return !!(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

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
