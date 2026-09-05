import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";
import { SUPPORT_EMAIL } from "../utils/supportEmail.js";

const router = express.Router();

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
      to: SUPPORT_EMAIL,
      subject: `Emovra feedback from ${user.name || user.email}`,
      text: `From: ${user.name || "(no name)"} <${user.email}>\nPage: ${page || "(not specified)"}\n\n${message.trim()}`,
    });

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
