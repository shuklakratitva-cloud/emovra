import express from "express";
import Entry, { decrypt } from "../models/Entry.js";
import Alert from "../models/Alert.js";
import { protect as auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

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
        reasons: obj.reasons,
        triggers: obj.triggers,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : obj.text || "[no text]",
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

// Back-compat alias for AdminPanel.jsx, which called /api/alerts/all
// (a route that never existed). Kept here rather than under /alerts/* so
// it still requires admin auth.
router.get("/all", auth, isAdmin, async (req, res) => {
  try {
    const alerts = await Entry.find({ riskLevel: { $in: ['RED', 'ORANGE'] } })
      .populate("userId", "name email age emergencyPhone emergencyName role")
      .sort({ createdAt: -1 })
      .limit(100);

    const result = alerts.map(a => {
      const obj = a.toObject();
      return {
        _id: obj._id,
        userName: obj.userId?.name,
        user: obj.userId,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : "",
        sosPhone: obj.userId?.emergencyPhone,
        emergencyPhone: obj.userId?.emergencyPhone,
        riskLevel: obj.riskLevel,
        createdAt: obj.createdAt,
      };
    });
    res.json(result);
  } catch (err) {
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
