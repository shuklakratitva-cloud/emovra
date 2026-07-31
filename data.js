import express from "express";
import Entry, { decrypt } from "../models/Entry.js";
import auth from "../middleware/auth.js";
import { awardXP } from "../utils/gamification.js";

const router = express.Router();

// Save entry - encrypted + fixed ORANGE/RED logic + emo abuse flag
router.post('/save', auth, async (req, res) => {
  try {
    const { text, score, emotion, reasons } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text required" });

    const entry = new Entry({
      userId: req.user.id,
      score: Number(score) || 0,
      emotion: emotion || "neutral",
      reasons: reasons || [],
    });

    entry._plainText = text;
    await entry.save();

    // NEW: XP for journaling - first entry ever also unlocks a badge
    const totalEntries = await Entry.countDocuments({ userId: req.user.id });
    const gam = await awardXP(req.user.id, 10, { firstJournalEntry: totalEntries === 1 });

    res.json({
      success: true,
      riskLevel: entry.riskLevel,
      score: entry.score,
      emoAbuseDetected: entry.emoAbuseDetected,
      message: "Saved securely (encrypted)",
      gamification: gam,
    });
  } catch (err) {
    console.error("Save entry error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// User sees ONLY his own entries - decrypted for him (secure because auth)
router.get('/my', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);

    const decrypted = entries.map(e => {
      const obj = e.toObject();
      return {
        _id: obj._id,
        riskLevel: obj.riskLevel,
        score: obj.score,
        emotion: obj.emotion,
        reasons: obj.reasons,
        emoAbuseDetected: obj.emoAbuseDetected,
        timestamp: obj.timestamp,
        createdAt: obj.createdAt,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : "[old entry - no encryption]"
      };
    });

    res.json(decrypted);
  } catch (err) {
    console.error("Get my entries error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
