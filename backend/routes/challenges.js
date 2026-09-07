import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { getTodayChallenges } from "../data/challenges.js";
import { completedChallengeIds, decorateChallenges } from "../utils/challengeProgress.js";
import { awardXP, todayStr } from "../utils/gamification.js";

const router = express.Router();

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
      challenges: await decorateChallenges(req.user.id, date, challenges, claimedToday),
    });
  } catch (err) {
    console.error("Today challenges error:", err);
    res.status(500).json({ success: false, message: "Failed to load challenges" });
  }
});

router.post("/:id/claim", auth, async (req, res) => {
  try {
    const date = todayStr();
    const challenges = getTodayChallenges(date);
    const challenge = challenges.find((c) => c.id === req.params.id);
    if (!challenge) return res.status(400).json({ success: false, message: "Not one of today's challenges" });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Your account no longer exists - please log in again." });
    }
    const already = user.claimedChallenges.some((c) => c.date === date && c.challengeId === challenge.id);
    if (already) return res.status(400).json({ success: false, message: "Already claimed today" });

    const completed = (await completedChallengeIds(req.user.id, date, [challenge.id])).has(challenge.id);
    if (!completed) {
      return res.status(400).json({ success: false, message: "Looks like you haven't done this one yet today - go do it, then come back and claim." });
    }

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
