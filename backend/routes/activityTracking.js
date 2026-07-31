import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { todayStr } from "../utils/gamification.js";

const router = express.Router();

// These exist ONLY so routes/challenges.js can verify the "log your mood"
// and "try a grounding exercise" challenges actually happened, since
// MoodTracker.jsx is otherwise 100% localStorage (no backend record at
// all) and GroundingExercises.jsx has no concept of "done" to record.
// No mood data or exercise content is stored here - just a date stamp.

router.post("/mood-checkin", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { lastMoodCheckinDate: todayStr() });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

router.post("/grounding-checkin", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { lastGroundingDate: todayStr() });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

export default router;
