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

// How many of the pool to offer each day. The pool has 9, so this must stay
// below that - the splice below removes each pick, so asking for more than
// the pool holds simply returns fewer, never a duplicate.
export const CHALLENGES_PER_DAY = 6;

export function getTodayChallenges(dateStr) {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...CHALLENGE_POOL];
  const picked = [];
  for (let i = 0; i < CHALLENGES_PER_DAY && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    // Take the HIGH bits, not `seed % pool.length`. This is a power-of-two
    // LCG, whose low bits have famously short periods - drawing from a pool
    // of 8 with `% 8` returned 6, then 0 forever. With three picks that was
    // survivable; at six it meant two challenges appeared literally every
    // single day and "make progress on a goal" appeared on 38% of them.
    const idx = Math.floor((seed / 4294967296) * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
