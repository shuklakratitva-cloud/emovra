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
