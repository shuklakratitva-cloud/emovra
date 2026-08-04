// backend/utils/gamification.js
// Single place XP/level/streak/badges get updated. Every route that awards
// XP calls awardXP() rather than touching User.xp directly, so the rules
// stay consistent (and can't be bypassed by a client sending its own xp
// value - none of these fields are ever accepted from req.body).

import User from "../models/User.js";
import { BADGES } from "../data/badges.js";

import { todayIST } from "./istDate.js";

// FIX: this used to be new Date().toISOString().slice(0,10) - UTC, not
// IST. See istDate.js for the full explanation of the ~5.5 hour nightly
// bug window this caused. Now delegates to the shared IST-aware helper.
export function todayStr() {
  return todayIST();
}

export function levelForXP(xp) {
  // Slow, gentle curve: level 1 at 0xp, level 2 at 50xp, level 5 at ~800xp,
  // level 10 at ~2500xp. Feel free to retune.
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00Z");
  const d2 = new Date(b + "T00:00:00Z");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Call this once per "the user did something today" moment - journal save,
// habit complete, challenge claim, chatbot use, or an explicit daily
// check-in. Safe to call multiple times a day; streak only updates once.
function bumpStreak(user) {
  const today = todayStr();
  if (user.lastActiveDate === today) return; // already counted today

  if (!user.lastActiveDate) {
    user.streakDays = 1;
  } else {
    const gap = daysBetween(user.lastActiveDate, today);
    if (gap === 1) user.streakDays += 1;
    else if (gap > 1) user.streakDays = 1; // streak broken
    // gap <= 0 (clock weirdness) - leave streak as-is
  }
  user.lastActiveDate = today;
}

function unlockBadge(user, badgeId) {
  if (!BADGES[badgeId]) return null;
  const already = user.badges.some((b) => b.id === badgeId);
  if (already) return null;
  user.badges.push({ id: badgeId, earnedAt: new Date() });
  return BADGES[badgeId];
}

function checkBadges(user, context = {}) {
  const newly = [];
  const add = (id) => { const b = unlockBadge(user, id); if (b) newly.push(b); };

  if (context.firstJournalEntry) add("first_entry");
  if (user.streakDays >= 3) add("streak_3");
  if (user.streakDays >= 7) add("streak_7");
  if (user.streakDays >= 30) add("streak_30");
  if (user.level >= 5) add("level_5");
  if (user.level >= 10) add("level_10");
  if (context.habitCompletions >= 5) add("habit_5");
  if (context.chatbotUsed) add("chatbot_chat");
  if (context.sharedJournal) add("shared_journal");
  if (context.claimedChallengeCount >= 10) add("challenge_10");

  return newly;
}

/**
 * Award XP to a user, bump their streak, recompute level, check badges.
 * Returns { user, newBadges, leveledUp } so the caller can surface a toast.
 */
export async function awardXP(userId, amount, context = {}) {
  if (!userId) return null;
  const user = await User.findById(userId);
  if (!user) return null;

  const prevLevel = user.level || 1;
  user.xp = (user.xp || 0) + Math.max(0, amount);
  bumpStreak(user);
  user.level = levelForXP(user.xp);

  const newBadges = checkBadges(user, context);
  await user.save();

  return {
    xp: user.xp,
    level: user.level,
    streakDays: user.streakDays,
    leveledUp: user.level > prevLevel,
    newBadges,
  };
}

export async function getGamificationProfile(userId) {
  const user = await User.findById(userId).select("xp level streakDays badges name");
  if (!user) return null;
  const nextLevelXP = 50 * Math.pow(user.level, 2);
  const currentLevelXP = 50 * Math.pow(user.level - 1, 2);
  const progress = nextLevelXP > currentLevelXP
    ? Math.min(1, (user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP))
    : 1;

  return {
    name: user.name,
    xp: user.xp,
    level: user.level,
    streakDays: user.streakDays,
    badges: user.badges.map((b) => ({ ...(BADGES[b.id] || { id: b.id, name: b.id }), earnedAt: b.earnedAt })),
    nextLevelXP,
    progress,
  };
}
