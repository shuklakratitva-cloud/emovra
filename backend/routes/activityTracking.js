import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { todayStr } from "../utils/gamification.js";

const router = express.Router();

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
