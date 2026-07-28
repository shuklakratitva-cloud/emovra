import express from "express";
import Entry, { decrypt } from "../models/Entry.js";
import User from "../models/User.js";
import { protect as auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// GET /api/admin/reds - Admin sees all RED critical alerts (FIXED for new schema)
router.get("/reds", auth, isAdmin, async (req, res) => {
  try {
    const reds = await Entry.find({ 
      $or: [
        { riskLevel: "RED" },
        { score: { $gte: 75 } },
        { isCritical: true }, // keep old field for backward compat
        { level: { $gte: 85 } }, // keep old field
      ]
    })
    .populate("userId", "name email age emergencyPhone emergencyName role")
    .sort({ createdAt: -1, timestamp: -1 })
    .limit(100);

    // Decrypt for admin only
    const decrypted = reds.map(e => {
      const obj = e.toObject();
      return {
        _id: obj._id,
        user: obj.userId, // user info only as you wanted
        riskLevel: obj.riskLevel,
        score: obj.score,
        emotion: obj.emotion,
        emoAbuseDetected: obj.emoAbuseDetected,
        reasons: obj.reasons,
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

// NEW: GET /api/admin/alerts - RED + ORANGE + Abuse - Main admin view
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
      return {
        _id: obj._id,
        user: obj.userId,
        riskLevel: obj.riskLevel,
        score: obj.score,
        emoAbuseDetected: obj.emoAbuseDetected, // separate indicator - only you see
        reasons: obj.reasons,
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

// NEW: GET /api/admin/abuse-only - Separate set ONLY for emotional abuse (encrypted in DB, you see user info)
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
        user: obj.userId, // only user info as you asked
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

// GET /api/admin/users - Admin sees all users (kept as yours)
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;