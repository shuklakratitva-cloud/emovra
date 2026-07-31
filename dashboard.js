import express from "express";
import { protect as auth } from "../middleware/auth.js";
import { getGamificationProfile, todayStr } from "../utils/gamification.js";
import { getTodayChallenges } from "../data/challenges.js";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import SharedJournal from "../models/SharedJournal.js";
import Entry from "../models/Entry.js";
import { decrypt } from "../utils/crypto.js";
import { detectEarlyWarning } from "../utils/earlyWarning.js";
import { THEMES } from "../data/themes.js";

const router = express.Router();

// GET /api/dashboard - one call for everything the post-login dashboard
// screen needs: level/xp/streak/badges, today's challenges, habits summary,
// a preview of the most recent thing a friend wrote in a shared journal,
// a birthday banner if it's today, and a supportive early-warning nudge if
// the last week has trended notably worse than the week before (never an
// automated alert to anyone else - see utils/earlyWarning.js).
router.get("/", auth, async (req, res) => {
  try {
    const [profile, user, habits, sharedJournals, recentEntries] = await Promise.all([
      getGamificationProfile(req.user.id),
      User.findById(req.user.id).select("claimedChallenges name themePreference avatar birthdayMonth birthdayDay"),
      Habit.find({ userId: req.user.id, archived: false }),
      SharedJournal.find({
        $or: [{ ownerId: req.user.id }, { "collaborators.userId": req.user.id }],
      }),
      Entry.find({ userId: req.user.id, createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } })
        .select("riskLevel createdAt"),
    ]);

    const date = todayStr();
    const challenges = getTodayChallenges(date);
    const claimedToday = new Set(
      (user?.claimedChallenges || []).filter((c) => c.date === date).map((c) => c.challengeId)
    );

    let friendEntryPreview = null;
    for (const j of sharedJournals) {
      for (const e of j.entries) {
        if (String(e.authorId) === String(req.user.id)) continue;
        if (!friendEntryPreview || e.timestamp > friendEntryPreview.timestamp) {
          friendEntryPreview = {
            journalId: j._id,
            journalTitle: j.title,
            authorName: e.authorName || "A friend",
            text: decrypt(e.text_encrypted),
            timestamp: e.timestamp,
          };
        }
      }
    }

    const today = new Date();
    const isBirthdayToday = user?.birthdayMonth === today.getMonth() + 1 && user?.birthdayDay === today.getDate();

    res.json({
      success: true,
      name: user?.name || "",
      avatar: user?.avatar || "🦋",
      theme: THEMES[user?.themePreference] || THEMES["classic-black-gold"],
      isBirthdayToday,
      gamification: profile,
      challenges: challenges.map((c) => ({ ...c, claimed: claimedToday.has(c.id) })),
      habits: {
        count: habits.length,
        dueToday: habits.filter((h) => h.lastCompletedDate !== date).length,
      },
      friendEntryPreview,
      earlyWarning: detectEarlyWarning(recentEntries),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
});

export default router;
