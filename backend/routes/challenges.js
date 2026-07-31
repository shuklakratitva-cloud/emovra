import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import PrivateJournal from "../models/PrivateJournal.js";
import Habit from "../models/Habit.js";
import SharedJournal from "../models/SharedJournal.js";
import SleepLog from "../models/SleepLog.js";
import Goal from "../models/Goal.js";
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

// FIX: this used to just trust the client and hand out XP for ANY
// challenge id with no verification the person actually did anything -
// meaning every challenge was claimable the moment the page loaded. Each
// challenge type now checks real data for today before allowing the claim.
async function didComplete(challengeId, userId, date) {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  switch (challengeId) {
    case "journal_entry":
      return !!(await PrivateJournal.exists({ userId, createdAt: { $gte: startOfDay, $lte: endOfDay } }));

    case "habit_complete":
      return !!(await Habit.exists({ userId, completions: date }));

    case "shared_journal": {
      const journals = await SharedJournal.find({
        $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
      }).select("entries.authorId entries.timestamp");
      return journals.some((j) =>
        j.entries.some((e) => String(e.authorId) === String(userId) && e.timestamp >= startOfDay && e.timestamp <= endOfDay)
      );
    }

    case "sleep_log":
      return !!(await SleepLog.exists({ userId, date }));

    case "goal_progress":
      return !!(await Goal.exists({ userId, updatedAt: { $gte: startOfDay, $lte: endOfDay } }));

    case "chatbot": {
      const u = await User.findById(userId).select("lastChatbotXPDate");
      return u?.lastChatbotXPDate === date;
    }

    case "quiz": {
      const u = await User.findById(userId).select("personalityResult");
      const takenAt = u?.personalityResult?.takenAt;
      return !!(takenAt && new Date(takenAt).toISOString().slice(0, 10) === date);
    }

    case "mood_checkin": {
      const u = await User.findById(userId).select("lastMoodCheckinDate");
      return u?.lastMoodCheckinDate === date;
    }

    case "grounding": {
      const u = await User.findById(userId).select("lastGroundingDate");
      return u?.lastGroundingDate === date;
    }

    default:
      return false;
  }
}

// POST /api/challenges/:id/claim - claim today's reward, ONLY if the
// backend can actually verify the underlying action happened today.
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const date = todayStr();
    const challenges = getTodayChallenges(date);
    const challenge = challenges.find((c) => c.id === req.params.id);
    if (!challenge) return res.status(400).json({ success: false, message: "Not one of today's challenges" });

    const user = await User.findById(req.user.id);
    const already = user.claimedChallenges.some((c) => c.date === date && c.challengeId === challenge.id);
    if (already) return res.status(400).json({ success: false, message: "Already claimed today" });

    const completed = await didComplete(challenge.id, req.user.id, date);
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
