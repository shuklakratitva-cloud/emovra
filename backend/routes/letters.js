import express from "express";
import { protect as auth } from "../middleware/auth.js";
import ScheduledLetter from "../models/ScheduledLetter.js";
import User from "../models/User.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { sendEmail } from "../utils/mailer.js";
import { todayIST } from "../utils/istDate.js";

const router = express.Router();

// GET /api/letters - your own scheduled letters (not-yet-delivered ones
// show a locked preview, delivered ones show the full text - this is a
// "write it and forget it" feature, not something to keep re-reading
// before its date)
router.get("/", auth, async (req, res) => {
  try {
    const letters = await ScheduledLetter.find({ userId: req.user.id }).sort({ deliverOn: 1 });
    res.json({
      success: true,
      letters: letters.map((l) => ({
        _id: l._id,
        deliverOn: l.deliverOn,
        delivered: l.delivered,
        text: l.delivered ? decrypt(l.text_encrypted) : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load letters" });
  }
});

// POST /api/letters - write one, pick a future date
router.post("/", auth, async (req, res) => {
  try {
    const { text, deliverOn } = req.body;
    if (!text?.trim() || !deliverOn) {
      return res.status(400).json({ success: false, message: "Text and a delivery date are required" });
    }
    const today = todayIST();
    if (deliverOn <= today) {
      return res.status(400).json({ success: false, message: "Pick a date in the future" });
    }
    const letter = await ScheduledLetter.create({
      userId: req.user.id,
      text_encrypted: encrypt(text.trim()),
      deliverOn,
    });
    res.status(201).json({ success: true, letter: { _id: letter._id, deliverOn: letter.deliverOn, delivered: false } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to schedule letter" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await ScheduledLetter.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
});

// POST /api/letters/deliver-due - triggered by the same external free
// cron pattern as the weekly digest / push reminder. Emails any letter
// whose deliverOn date has arrived, and marks it delivered.
router.post("/deliver-due", async (req, res) => {
  try {
    const providedSecret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const today = todayIST();
    const due = await ScheduledLetter.find({ delivered: false, deliverOn: { $lte: today } }).populate("userId", "email name");

    let sent = 0;
    for (const letter of due) {
      if (!letter.userId) continue;
      const text = decrypt(letter.text_encrypted);
      const ok = await sendEmail({
        to: letter.userId.email,
        subject: "A letter from your past self",
        text: `Hi ${letter.userId.name || ""},\n\nYou wrote this to yourself a while back, scheduled for today:\n\n"${text}"\n\n- Sent by your past self, via Emovra`,
      });
      letter.delivered = true;
      await letter.save();
      if (ok) sent++;
    }

    console.log(`[LETTERS] Delivered ${sent}/${due.length} due letters`);
    res.json({ success: true, sent, due: due.length });
  } catch (err) {
    console.error("Letter delivery error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
