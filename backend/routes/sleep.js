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

    const existed = await SleepLog.exists({ userId: req.user.id, date });

    const log = await SleepLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { bedtime, wakeTime, hoursSlept, quality, notes: notes || "" },
      // FIX: without runValidators the schema's own bounds (quality 1-5)
      // are not applied on an update, so {quality: 9999, hoursSlept: -50}
      // persisted happily and then skewed the sleep chart and averages.
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    const gam = existed ? null : await awardXP(req.user.id, 6, {});
    res.json({ success: true, log, gamification: gam });
  } catch (err) {
    console.error("Sleep log error:", err);
    res.status(500).json({ success: false, message: "Failed to save sleep log" });
  }
});

export default router;
