import User from "../models/User.js";
import { BADGES } from "../data/badges.js";

import { todayIST } from "./istDate.js";

export function todayStr() {
  return todayIST();
}

export function levelForXP(xp) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00Z");
  const d2 = new Date(b + "T00:00:00Z");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function bumpStreak(user) {
  const today = todayStr();
  if (user.lastActiveDate === today) return;

  if (!user.lastActiveDate) {
    user.streakDays = 1;
  } else {
    const gap = daysBetween(user.lastActiveDate, today);
    if (gap === 1) user.streakDays += 1;
    else if (gap > 1) user.streakDays = 1;
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
  const add = (id) => {
    const b = unlockBadge(user, id);
    if (b) newly.push(b);
  };

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

export async function awardXP(userId, amount, context = {}) {
  if (!userId) return null;

  // FIX: this used to read the user, mutate xp/level/streak/badges in
  // memory, then .save() the whole document - a classic lost-update race.
  // Two awardXP calls for the same user landing close together (e.g.
  // completing a habit and claiming a daily challenge within the same
  // second - both separate requests, each calling this) could both read
  // the same starting xp, and whichever save() finished last silently
  // overwrote the other's increment, losing XP and any badge unlocked
  // only in the "losing" call. xp is now incremented atomically via
  // MongoDB's $inc, which is race-safe regardless of how many concurrent
  // calls land - no lost-update window for the number that actually
  // matters. streak/level/badges are still read-then-write against a
  // freshly-read copy (best effort, same as before, not worse) - fully
  // atomic guarantees there would need a transaction, which is a bigger
  // change than this bug warrants.
  const clampedAmount = Math.max(0, amount);
  const afterXP = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: clampedAmount } },
    { new: true }
  );
  if (!afterXP) return null;

  const prevLevel = levelForXP(afterXP.xp - clampedAmount) || 1;
  bumpStreak(afterXP);
  afterXP.level = levelForXP(afterXP.xp);
  const newBadges = checkBadges(afterXP, context);

  await User.findByIdAndUpdate(userId, {
    level: afterXP.level,
    streakDays: afterXP.streakDays,
    lastActiveDate: afterXP.lastActiveDate,
    badges: afterXP.badges,
  });

  return {
    xp: afterXP.xp,
    level: afterXP.level,
    streakDays: afterXP.streakDays,
    leveledUp: afterXP.level > prevLevel,
    newBadges,
  };
}

export async function getGamificationProfile(userId) {
  const user = await User.findById(userId).select("xp level streakDays badges name");
  if (!user) return null;
  const nextLevelXP = 50 * Math.pow(user.level, 2);
  const currentLevelXP = 50 * Math.pow(user.level - 1, 2);
  const progress =
    nextLevelXP > currentLevelXP
      ? Math.min(1, (user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP))
      : 1;

  return {
    name: user.name,
    xp: user.xp,
    level: user.level,
    streakDays: user.streakDays,
    badges: user.badges.map((b) => ({
      ...(BADGES[b.id] || { id: b.id, name: b.id }),
      earnedAt: b.earnedAt,
    })),
    nextLevelXP,
    progress,
  };
}
