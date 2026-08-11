import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();

// NEW: in-app feedback/bug reporting. Previously the only way an issue
// got noticed was a screenshot or catching it directly - this gives any
// logged-in user a real way to flag something, emailed straight to the
// developer via the same Resend setup already used for other mail.
// Deliberately simple: no new database model, no admin UI to build and
// maintain - just a real, working "send a message" that actually reaches
// someone, which is the part that matters most.
router.post("/", auth, async (req, res) => {
  try {
    const { message, page } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Feedback message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: "Feedback is too long (max 2000 characters)" });
    }

    const user = await User.findById(req.user.id).select("name email");
    if (!user) {
      return res.status(401).json({ success: false, message: "Your account no longer exists - please log in again." });
    }

    const sent = await sendEmail({
      to: "shukla.kratitva@gmail.com",
      subject: `Emovra feedback from ${user.name || user.email}`,
      text: `From: ${user.name || "(no name)"} <${user.email}>\nPage: ${page || "(not specified)"}\n\n${message.trim()}`,
    });

    // Even if email sending isn't configured (RESEND_API_KEY missing) or
    // fails for some reason, still tell the person their feedback was
    // received rather than showing an error for something outside their
    // control - it's logged either way, so nothing is silently lost.
    if (!sent) {
      console.log(`[FEEDBACK - email not sent] ${user.email}: ${message.trim()}`);
    }

    res.json({ success: true, message: "Thanks - your feedback was sent." });
  } catch (err) {
    console.error("Feedback submission error:", err.message);
    res.status(500).json({ success: false, message: "Something went wrong sending your feedback." });
  }
});

export default router;
