// backend/data/challenges.js - challenge pool. 3 are picked deterministically
// per day (seeded by date, so everyone sees the same 3 challenges on a given
// day, but they still need to be completed individually).
export const CHALLENGE_POOL = [
  { id: "journal_entry",   title: "Write a journal entry",         xp: 15, emoji: "📖" },
  { id: "grounding",       title: "Try a grounding exercise",      xp: 10, emoji: "🧘" },
  { id: "mood_checkin",    title: "Log how you're feeling",        xp: 8,  emoji: "😊" },
  { id: "habit_complete",  title: "Complete a habit",              xp: 10, emoji: "✅" },
  { id: "gratitude",       title: "Write down one thing you're grateful for", xp: 8, emoji: "🙏" },
  { id: "breathe",         title: "Do 5 rounds of deep breathing", xp: 8,  emoji: "🌬" },
  { id: "reach_out",       title: "Message someone you trust",     xp: 12, emoji: "💌" },
  { id: "shared_journal",  title: "Write in your shared journal",  xp: 10, emoji: "👯" },
  { id: "chatbot",         title: "Chat with Emovra AI for a bit", xp: 10, emoji: "💬" },
  { id: "screen_break",    title: "Take a 10-minute screen break", xp: 6,  emoji: "📵" },
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
