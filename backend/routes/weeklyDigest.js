import express from "express";
import User from "../models/User.js";
import PrivateJournal from "../models/PrivateJournal.js";
import Habit from "../models/Habit.js";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();

// ============================================================
// WEEKLY REFLECTION EMAIL
//
// IMPORTANT DESIGN DECISION: this email only ever includes privacy-safe
// AGGREGATE COUNTS - journal entry count, habit completions, streak days,
// XP. It never includes actual check-in text, mood/emotion labels, or
// risk level, even in summary form. Email is not a secure-enough channel
// for anything that sensitive, regardless of how the rest of the app
// encrypts data at rest.
//
// This isn't triggered by Render itself - Render's free tier has no
// built-in cron scheduler. Instead, this route is meant to be called
// weekly by a free external cron service (e.g. cron-job.org or
// UptimeRobot's monitor-as-a-trigger), protected by a shared secret so
// the public can't trigger it.
//
// REQUIRED ENV VAR: CRON_SECRET (any random string you choose - this is
// NOT a service you sign up for, just a password you invent yourself and
// put in both Render's env vars and the cron service's request headers).
// ============================================================

router.post("/send-weekly", async (req, res) => {
  try {
    const providedSecret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Only users who haven't gotten one in the last 7 days
    const users = await User.find({
      $or: [
        { lastWeeklyDigestSent: "" },
        { lastWeeklyDigestSent: { $lt: new Date(sevenDaysAgo).toISOString().slice(0, 10) } },
      ],
    }).select("_id name email streakDays xp claimedChallenges");

    let sent = 0;
    for (const user of users) {
      const journalCount = await PrivateJournal.countDocuments({ userId: user._id, createdAt: { $gte: sevenDaysAgo } });
      const habitCompletions = await Habit.aggregate([
        { $match: { userId: user._id } },
        { $project: { count: { $size: { $filter: { input: "$completions", cond: { $gte: ["$$this", sevenDaysAgo.toISOString().slice(0, 10)] } } } } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]);
      const challengesThisWeek = (user.claimedChallenges || []).filter((c) => new Date(c.claimedAt || c.date) >= sevenDaysAgo).length;
      const habitTotal = habitCompletions[0]?.total || 0;

      // Skip sending to genuinely inactive accounts - a "you did nothing" email helps no one
      if (journalCount === 0 && habitTotal === 0 && challengesThisWeek === 0) {
        continue;
      }

      const lines = [
        `Hi ${user.name || "there"},`,
        ``,
        `Here's your week on Emovra:`,
        journalCount > 0 ? `- ${journalCount} journal ${journalCount === 1 ? "entry" : "entries"}` : null,
        habitTotal > 0 ? `- ${habitTotal} habit ${habitTotal === 1 ? "completion" : "completions"}` : null,
        challengesThisWeek > 0 ? `- ${challengesThisWeek} daily ${challengesThisWeek === 1 ? "challenge" : "challenges"} completed` : null,
        `- ${user.streakDays || 0}-day streak`,
        ``,
        `Keep going - see you in the app.`,
      ].filter(Boolean).join("\n");

      const ok = await sendEmail({ to: user.email, subject: "Your week on Emovra", text: lines });
      if (ok) {
        await User.findByIdAndUpdate(user._id, { lastWeeklyDigestSent: todayStr });
        sent++;
      }
    }

    console.log(`[WEEKLY-DIGEST] Sent to ${sent}/${users.length} eligible users`);
    res.json({ success: true, sent, eligible: users.length });
  } catch (err) {
    console.error("Weekly digest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
