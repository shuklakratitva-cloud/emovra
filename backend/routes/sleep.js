import express from "express";
import { protect as auth } from "../middleware/auth.js";
import SleepLog from "../models/SleepLog.js";
import { awardXP, todayStr } from "../utils/gamification.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const logs = await SleepLog.find({ userId: req.user.id }).sort({ date: -1 }).limit(30);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load sleep logs" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { bedtime, wakeTime, hoursSlept, quality, notes } = req.body;
    const date = todayStr();

    // FIX (vulnerability): check for an existing log BEFORE the upsert -
    // previously awardXP ran unconditionally on every call, so repeatedly
    // re-saving/editing today's log farmed unlimited XP.
    const existed = await SleepLog.exists({ userId: req.user.id, date });

    const log = await SleepLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { bedtime, wakeTime, hoursSlept, quality, notes: notes || "" },
      { upsert: true, new: true }
    );

    const gam = existed ? null : await awardXP(req.user.id, 6, {});
    res.json({ success: true, log, gamification: gam });
  } catch (err) {
    console.error("Sleep log error:", err);
    res.status(500).json({ success: false, message: "Failed to save sleep log" });
  }
});

export default router;
