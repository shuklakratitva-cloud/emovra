import express from "express";
import { protect as auth } from "../middleware/auth.js";
import Entry from "../models/Entry.js";
import { detectEarlyWarning } from "../utils/earlyWarning.js";

const router = express.Router();

// GET /api/insights/summary - the mental health insights dashboard.
// Framed supportively throughout - this is reflection, not diagnosis.
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
      riskCounts, // note: GREEN entries aren't saved at all per the privacy rule, so this only ever reflects RED/ORANGE history
      earlyWarning, // null if nothing concerning, otherwise { message, ... } for a supportive banner
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ success: false, message: "Failed to load insights" });
  }
});

// GET /api/insights/calendar?month=2026-07 - monthly wellness calendar:
// one entry per day that had a saved (RED/ORANGE) entry. Content stays
// encrypted/private - this only returns counts and risk levels per day,
// never the actual text.
router.get("/calendar", auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const entries = await Entry.find({
      userId: req.user.id,
      createdAt: { $gte: start, $lt: end },
    }).select("riskLevel emotion createdAt");

    const byDay = {};
    entries.forEach((e) => {
      const day = new Date(e.createdAt).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, highestRisk: "ORANGE", emotions: [] };
      byDay[day].count += 1;
      if (e.riskLevel === "RED") byDay[day].highestRisk = "RED";
      if (e.emotion) byDay[day].emotions.push(e.emotion);
    });

    res.json({ success: true, month, days: byDay });
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(500).json({ success: false, message: "Failed to load calendar" });
  }
});

export default router;
