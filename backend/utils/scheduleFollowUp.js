import mongoose from "mongoose";
import FollowUp from "../models/FollowUp.js";

export const FOLLOW_UP_DELAY_MS = 24 * 60 * 60 * 1000;

// Called from every path that stores a RED entry (utils/saveAnalysis.js and
// routes/data.js), so the check-back does not depend on which classifier
// tier happened to answer.
//
// Two rules that matter more than they look:
//
//   1. RED only. Extending this to ORANGE was tempting and would be wrong -
//      ORANGE fires on ordinary bad days, and a student who gets checked on
//      every time they type "I feel anxious" learns to read the card as
//      noise, which is exactly the state you don't want it in on the day it
//      follows a real disclosure.
//
//   2. One pending follow-up per student, ever. Someone in a genuinely bad
//      week can trip RED several times; stacking a card per disclosure
//      would greet them with a queue of "are you okay?" prompts, which
//      reads as surveillance rather than care. If one is already waiting,
//      this is a no-op and the existing one stands.
//
// Never throws: a failure here must not take down the save of the crisis
// record itself, which is the far more important write.
export async function scheduleFollowUp(userId, entryId = null) {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

    const existing = await FollowUp.findOne({ userId, status: "pending" });
    if (existing) {
      console.log(`[FOLLOWUP-SKIP] one already pending for User:${userId}`);
      return existing;
    }

    const followUp = await FollowUp.create({
      userId,
      entryId: entryId && mongoose.Types.ObjectId.isValid(entryId) ? entryId : null,
      dueAt: new Date(Date.now() + FOLLOW_UP_DELAY_MS),
    });
    console.log(`[FOLLOWUP-SCHEDULED] due ${followUp.dueAt.toISOString()} User:${userId}`);
    return followUp;
  } catch (e) {
    console.error("scheduleFollowUp error (crisis record still saved):", e.message);
    return null;
  }
}
