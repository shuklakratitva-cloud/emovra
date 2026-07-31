import express from "express";
import { protect as auth } from "../middleware/auth.js";
import { awardXP, getGamificationProfile, todayStr } from "../utils/gamification.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/gamification/me - xp/level/streak/badges for the dashboard
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await getGamificationProfile(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, ...profile });
  } catch (err) {
    console.error("Gamification profile error:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// POST /api/gamification/checkin - simple daily "I showed up today" - small
// XP, mainly exists to bump the streak even on days you don't do anything
// else trackable.
router.post("/checkin", auth, async (req, res) => {
  try {
    // FIX (vulnerability): this had NO guard - calling this endpoint
    // repeatedly awarded 5 XP every single time, with no limit. Now only
    // awards once per calendar day, same as it was always intended to.
    const today = todayStr();
    const user = await User.findById(req.user.id).select("lastActiveDate xp level streakDays");
    if (user?.lastActiveDate === today) {
      const profile = await getGamificationProfile(req.user.id);
      return res.json({ success: true, xp: profile.xp, level: profile.level, streakDays: profile.streakDays, leveledUp: false, newBadges: [], date: today, alreadyCheckedInToday: true });
    }

    const result = await awardXP(req.user.id, 5, {});
    res.json({ success: true, ...result, date: today });
  } catch (err) {
    console.error("Checkin error:", err);
    res.status(500).json({ success: false, message: "Check-in failed" });
  }
});

export default router;
