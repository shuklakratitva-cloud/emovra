import express from "express";
import Entry, { decrypt } from "../models/Entry.js";
import Alert from "../models/Alert.js";
import User from "../models/User.js";
import { protect as auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// GET /api/admin/impact-stats - aggregate, anonymized usage numbers for
// funding pitches / competition reporting. No names, emails, or message
// content - just counts, so this is safe to screenshot or quote directly.
//
// NOTE: Entry has a TTL index (models/Entry.js) that auto-deletes
// check-in records 30 days after creation, so there's no real "all-time
// check-ins" number to report from this collection - only rolling
// 30-day/7-day windows. totalUsers comes from the User collection
// instead, which isn't subject to that expiry.
router.get("/impact-stats", auth, isAdmin, async (req, res) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      checkIns30d,
      checkIns7d,
      activeUsers30d,
      activeUsers7d,
      redAlerts30d,
      orangeAlerts30d,
      dailyTrendRaw,
    ] = await Promise.all([
      User.countDocuments({}),
      Entry.countDocuments({ createdAt: { $gte: since30 } }),
      Entry.countDocuments({ createdAt: { $gte: since7 } }),
      Entry.distinct("userId", { createdAt: { $gte: since30 }, userId: { $ne: null } }).then((a) => a.length),
      Entry.distinct("userId", { createdAt: { $gte: since7 }, userId: { $ne: null } }).then((a) => a.length),
      Entry.countDocuments({ riskLevel: "RED", createdAt: { $gte: since30 } }),
      Entry.countDocuments({ riskLevel: "ORANGE", createdAt: { $gte: since30 } }),
      Entry.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      retentionNote: "Check-in activity is kept for 30 days, then auto-deleted - the numbers below reflect that rolling window, not all-time totals.",
      stats: {
        totalUsers,
        checkIns30d,
        checkIns7d,
        activeUsers30d,
        activeUsers7d,
        redAlerts30d,
        orangeAlerts30d,
        dailyTrend: dailyTrendRaw.map((d) => ({ date: d._id, count: d.count })),
      },
    });
  } catch (err) {
    console.error("Impact stats error:", err);
    res.status(500).json({ success: false, message: "Failed to load impact stats" });
  }
});

router.get("/reds", auth, isAdmin, async (req, res) => {
  try {
    const reds = await Entry.find({
      $or: [
        { riskLevel: "RED" },
        { score: { $gte: 75 } },
      ]
    })
    .populate("userId", "name email age emergencyPhone emergencyName role")
    .sort({ createdAt: -1, timestamp: -1 })
    .limit(100);

    const decrypted = reds.map(e => {
      const obj = e.toObject();
      // FIX: this route used to decrypt and return the message of EVERY
      // RED / score>=75 entry with no gate at all, while the Privacy Policy
      // tells students an admin can read their words only for "a narrow
      // category (school-related emotional abuse)". /api/admin/alerts
      // already honoured that promise; this one silently didn't. The admin
      // panel happens not to call /reds today, so nothing was being read
      // through it - but a live endpoint that contradicts your own written
      // policy is a breach waiting for the first person who opens it.
      //
      // Same isAbuseCase test as /alerts, deliberately, so the two can't
      // drift apart: an admin gets the identity and routing details they
      // need to check in on any student at risk, but the disclosure itself
      // stays encrypted at rest and unread unless it is an abuse report a
      // human is required to act on.
      const isAbuseCase =
        obj.category === "school_emotional_abuse" ||
        obj.emoAbuseDetected === true ||
        obj.abuseType === "home_abuse" ||
        obj.abuseType === "school_emotional_abuse";
      return {
        _id: obj._id,
        user: obj.userId,
        riskLevel: obj.riskLevel,
        score: obj.score,
        emotion: obj.emotion,
        category: obj.category,
        abuseType: obj.abuseType,
        abuseSource: obj.abuseSource,
        emoAbuseDetected: obj.emoAbuseDetected,
        isAbuseCase,
        reasons: obj.reasons,
        triggers: obj.triggers,
        text: isAbuseCase ? (obj.text_encrypted ? decrypt(obj.text_encrypted) : obj.text || "") : null,
        textHidden: !isAbuseCase,
        timestamp: obj.timestamp || obj.createdAt,
        createdAt: obj.createdAt
      };
    });

    res.json(decrypted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

router.get("/alerts", auth, isAdmin, async (req, res) => {
  try {
    const alerts = await Entry.find({
      $or: [
        { riskLevel: { $in: ['RED', 'ORANGE'] } },
        { emoAbuseDetected: true }
      ]
    })
    .populate("userId", "name email age emergencyPhone emergencyName role")
    .sort({ timestamp: -1, createdAt: -1 })
    .limit(100);

    const result = alerts.map(a => {
      const obj = a.toObject();
      const isAbuseCase = obj.category === "school_emotional_abuse" || obj.emoAbuseDetected === true || obj.abuseType === "home_abuse" || obj.abuseType === "school_emotional_abuse";
      return {
        _id: obj._id,
        user: obj.userId,
        riskLevel: obj.riskLevel,
        score: obj.score,
        category: obj.category,
        abuseType: obj.abuseType,
        abuseSource: obj.abuseSource,
        emoAbuseDetected: obj.emoAbuseDetected,
        isAbuseCase,
        reasons: obj.reasons,
        triggers: obj.triggers,
        text: isAbuseCase ? (obj.text_encrypted ? decrypt(obj.text_encrypted) : obj.text || "") : null,
        textHidden: !isAbuseCase,
        timestamp: obj.timestamp || obj.createdAt
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/admin/school-abuse - ONLY the classroom-abuse `alerts` collection
router.get("/school-abuse", auth, isAdmin, async (req, res) => {
  try {
    const alerts = await Alert.find({ category: "school_emotional_abuse" })
      .populate("userId", "name email age emergencyPhone emergencyName role")
      .sort({ createdAt: -1 })
      .limit(100);

    const result = alerts.map(a => {
      const obj = a.toObject();
      return {
        _id: obj._id,
        user: obj.userId,
        riskLevel: obj.riskLevel,
        score: obj.score,
        category: obj.category,
        abuseType: obj.abuseType,
        abuseSource: obj.abuseSource,
        triggers: obj.triggers,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : "",
        status: obj.status,
        timestamp: obj.createdAt
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/admin/abuse-only
router.get("/abuse-only", auth, isAdmin, async (req, res) => {
  try {
    const abuse = await Entry.find({ emoAbuseDetected: true })
      .populate("userId", "name email age emergencyPhone emergencyName role")
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(100);

    const result = abuse.map(a => {
      const obj = a.toObject();
      return {
        _id: obj._id,
        user: obj.userId,
        riskLevel: obj.riskLevel,
        score: obj.score,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : obj.text || "",
        timestamp: obj.timestamp || obj.createdAt
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
