// backend/data/badges.js - badge catalog. Adding a new badge is just
// adding an entry here + a check in utils/gamification.js.
export const BADGES = {
  first_entry:   { id: "first_entry",   name: "First Steps",       emoji: "🌱", description: "Wrote your first journal entry" },
  streak_3:      { id: "streak_3",      name: "Building Momentum", emoji: "🔥", description: "3-day check-in streak" },
  streak_7:      { id: "streak_7",      name: "Week Warrior",      emoji: "🏆", description: "7-day check-in streak" },
  streak_30:     { id: "streak_30",     name: "Habit Master",      emoji: "👑", description: "30-day check-in streak" },
  level_5:       { id: "level_5",       name: "Rising Star",       emoji: "⭐", description: "Reached level 5" },
  level_10:      { id: "level_10",      name: "Emovra Veteran",    emoji: "💎", description: "Reached level 10" },
  habit_5:       { id: "habit_5",       name: "Habit Hero",        emoji: "✅", description: "Completed a habit 5 times" },
  chatbot_chat:  { id: "chatbot_chat",  name: "Good Listener",     emoji: "💬", description: "Had a real conversation with Emovra AI" },
  shared_journal:{ id: "shared_journal",name: "Better Together",   emoji: "👯", description: "Started or joined a shared journal" },
  challenge_10:  { id: "challenge_10",  name: "Challenge Crusher", emoji: "🎯", description: "Claimed 10 daily challenges" },
};
