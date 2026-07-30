import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { getTodayChallenges } from "../data/challenges.js";
import { awardXP, todayStr } from "../utils/gamification.js";

const router = express.Router();

// GET /api/challenges/today - today's 3 challenges + which ones this user
// has already claimed
router.get("/today", auth, async (req, res) => {
  try {
    const date = todayStr();
    const challenges = getTodayChallenges(date);
    const user = await User.findById(req.user.id).select("claimedChallenges");
    const claimedToday = new Set(
      (user?.claimedChallenges || [])
        .filter((c) => c.date === date)
        .map((c) => c.challengeId)
    );

    res.json({
      success: true,
      date,
      challenges: challenges.map((c) => ({ ...c, claimed: claimedToday.has(c.id) })),
    });
  } catch (err) {
    console.error("Today challenges error:", err);
    res.status(500).json({ success: false, message: "Failed to load challenges" });
  }
});

// POST /api/challenges/:id/claim - claim today's reward for a challenge id
// (trusts that the client only shows the button after the person actually
// did the thing - same trust model as the rest of the app's client-side
// interactions. XP amount is still looked up server-side from the catalog,
// never taken from the request body.)
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const date = todayStr();
    const challenges = getTodayChallenges(date);
    const challenge = challenges.find((c) => c.id === req.params.id);
    if (!challenge) return res.status(400).json({ success: false, message: "Not one of today's challenges" });

    const user = await User.findById(req.user.id);
    const already = user.claimedChallenges.some((c) => c.date === date && c.challengeId === challenge.id);
    if (already) return res.status(400).json({ success: false, message: "Already claimed today" });

    user.claimedChallenges.push({ date, challengeId: challenge.id });
    await user.save();

    const claimedTodayCount = user.claimedChallenges.filter((c) => c.date === date).length;
    const totalClaimedCount = user.claimedChallenges.length;

    const result = await awardXP(req.user.id, challenge.xp, { claimedChallengeCount: totalClaimedCount });

    res.json({ success: true, ...result, claimedTodayCount });
  } catch (err) {
    console.error("Claim challenge error:", err);
    res.status(500).json({ success: false, message: "Failed to claim challenge" });
  }
});

export default router;
