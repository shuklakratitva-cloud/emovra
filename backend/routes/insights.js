import express from "express";
import { protect as auth } from "../middleware/auth.js";
import Entry from "../models/Entry.js";
import { detectEarlyWarning } from "../utils/earlyWarning.js";
import { toISTDateStr } from "../utils/istDate.js";

const router = express.Router();

router.get("/summary", auth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const entries = await Entry.find({ userId: req.user.id, createdAt: { $gte: since } })
      .select("riskLevel emotion score createdAt")
      .sort({ createdAt: -1 });

    const emotionCounts = {};
    const riskCounts = { GREEN: 0, ORANGE: 0, RED: 0 };
    entries.forEach((e) => {
      if (e.emotion) emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      if (riskCounts[e.riskLevel] !== undefined) riskCounts[e.riskLevel] += 1;
    });

    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const earlyWarning = detectEarlyWarning(entries);

    res.json({
      success: true,
      periodDays: 30,
      totalCheckIns: entries.length,
      emotionCounts,
      topEmotion,
      riskCounts,
      earlyWarning,
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ success: false, message: "Failed to load insights" });
  }
});

router.get("/calendar", auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const entries = await Entry.find({
      userId: req.user.id,
      createdAt: { $gte: start, $lt: end },
    }).select("riskLevel emotion createdAt");

    // FIX: highestRisk used to default to "ORANGE" for every day that had
    // any entries at all, and only ever escalated to "RED" - so a day with
    // only GREEN check-ins was shown back to the user as an elevated
    // ORANGE day in their own calendar. Now starts at GREEN and escalates
    // through the real order (GREEN < YELLOW < ORANGE < RED).
    const RISK_RANK = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };
    const byDay = {};
    entries.forEach((e) => {
      const day = toISTDateStr(e.createdAt);
      if (!byDay[day]) byDay[day] = { count: 0, highestRisk: "GREEN", emotions: [] };
      byDay[day].count += 1;
      const rank = RISK_RANK[e.riskLevel];
      if (rank !== undefined && rank > RISK_RANK[byDay[day].highestRisk]) {
        byDay[day].highestRisk = e.riskLevel;
      }
      if (e.emotion) byDay[day].emotions.push(e.emotion);
    });

    res.json({ success: true, month, days: byDay });
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(500).json({ success: false, message: "Failed to load calendar" });
  }
});

export default router;
