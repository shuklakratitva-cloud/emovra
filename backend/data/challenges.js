// backend/data/challenges.js - challenge pool. 3 are picked deterministically
// per day (seeded by date, so everyone sees the same 3 challenges on a given
// day, but they still need to be completed individually).
//
// FIX: every challenge here now maps to something the backend can actually
// verify happened before letting you claim it (see routes/challenges.js).
// The previous pool included things like "Take a 10-minute screen break" or
// "Message someone you trust" that have no way to be checked server-side at
// all - those were removed rather than left as an honesty-system trust
// (which is exactly why claiming worked with no real action behind it).
export const CHALLENGE_POOL = [
  { id: "journal_entry",   title: "Write a journal entry",         xp: 15, emoji: "📖" },
  { id: "grounding",       title: "Try a grounding exercise",      xp: 10, emoji: "🧘" },
  { id: "mood_checkin",    title: "Log how you're feeling",        xp: 8,  emoji: "😊" },
  { id: "habit_complete",  title: "Complete a habit",              xp: 10, emoji: "✅" },
  { id: "shared_journal",  title: "Write in your shared journal",  xp: 10, emoji: "👯" },
  { id: "chatbot",         title: "Chat with Emovra AI for a bit", xp: 10, emoji: "💬" },
  { id: "sleep_log",       title: "Log last night's sleep",        xp: 6,  emoji: "🌙" },
  { id: "quiz",            title: "Take the strength quiz",        xp: 8,  emoji: "🧩" },
  { id: "goal_progress",   title: "Make progress on a goal",       xp: 10, emoji: "🗺" },
];

// Deterministic daily pick - same 3 for everyone on a given calendar day.
export function getTodayChallenges(dateStr) {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...CHALLENGE_POOL];
  const picked = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
