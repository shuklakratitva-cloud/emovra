import User from "../models/User.js";
import PrivateJournal from "../models/PrivateJournal.js";
import Habit from "../models/Habit.js";
import SharedJournal from "../models/SharedJournal.js";
import SleepLog from "../models/SleepLog.js";
import Goal from "../models/Goal.js";
import { istDayBounds, toISTDateStr } from "./istDate.js";

// Which challenges are answered by fields already on the user document
// rather than by a query against another collection.
const USER_DERIVED = new Set(["chatbot", "quiz", "mood_checkin", "grounding"]);
const USER_FIELDS = "lastChatbotXPDate lastMoodCheckinDate lastGroundingDate personalityResult";

// Returns the subset of `ids` the student has actually done today.
//
// This used to live inline in routes/challenges.js and ran only on a claim,
// one challenge at a time. It is now called on every dashboard load for six
// challenges at once, so the shape matters:
//
//   - the four user-derived checks share ONE User read instead of four;
//   - the collection checks run together rather than in series;
//   - nothing is queried for a challenge that is not in today's set.
//
// A failing check resolves to "not done" rather than rejecting. That is safe
// only because the Claim button stays clickable either way - the server is
// still the authority on whether XP is owed, so a check that errors costs a
// student a hint, never the XP itself.
export async function completedChallengeIds(userId, date, ids) {
  const wanted = new Set(ids);
  const { start, end } = istDayBounds(date);
  const done = new Set();

  const jobs = [];
  const check = (id, run) => {
    if (!wanted.has(id)) return;
    jobs.push(
      Promise.resolve()
        .then(run)
        .then((ok) => { if (ok) done.add(id); })
        .catch((e) => console.error(`Challenge check "${id}" failed:`, e.message))
    );
  };

  check("journal_entry", () =>
    PrivateJournal.exists({ userId, createdAt: { $gte: start, $lte: end } }));

  check("habit_complete", () =>
    Habit.exists({ userId, completions: date }));

  check("sleep_log", () =>
    SleepLog.exists({ userId, date }));

  check("goal_progress", () =>
    Goal.exists({ userId, updatedAt: { $gte: start, $lte: end } }));

  check("shared_journal", async () => {
    const journals = await SharedJournal.find({
      $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
    }).select("entries.authorId entries.timestamp");
    return journals.some((j) =>
      j.entries.some(
        (e) => String(e.authorId) === String(userId) && e.timestamp >= start && e.timestamp <= end
      )
    );
  });

  if ([...wanted].some((id) => USER_DERIVED.has(id))) {
    jobs.push(
      User.findById(userId)
        .select(USER_FIELDS)
        .then((u) => {
          if (!u) return;
          if (wanted.has("chatbot") && u.lastChatbotXPDate === date) done.add("chatbot");
          if (wanted.has("mood_checkin") && u.lastMoodCheckinDate === date) done.add("mood_checkin");
          if (wanted.has("grounding") && u.lastGroundingDate === date) done.add("grounding");
          if (wanted.has("quiz")) {
            const takenAt = u.personalityResult?.takenAt;
            if (takenAt && toISTDateStr(takenAt) === date) done.add("quiz");
          }
        })
        .catch((e) => console.error("Challenge user checks failed:", e.message))
    );
  }

  await Promise.all(jobs);
  return done;
}

// Convenience wrapper: takes today's challenge list and the ids already
// claimed, and returns the list the API sends to the client.
export async function decorateChallenges(userId, date, challenges, claimedIds) {
  const done = await completedChallengeIds(userId, date, challenges.map((c) => c.id));
  return challenges.map((c) => ({
    ...c,
    claimed: claimedIds.has(c.id),
    completed: done.has(c.id),
  }));
}
