import express from "express";
import Entry from "../models/Entry.js";
import User from "../models/User.js";
import { protect as auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// GET /api/admin/reds - Admin sees all RED critical alerts
router.get("/reds", auth, isAdmin, async (req, res) => {
  try {
    const reds = await Entry.find({ 
      $or: [
        { isCritical: true }, 
        { level: { $gte: 85 } }, 
        { triggers: { $exists: true, $ne: [] } }
      ]
    })
    .populate("userId", "name email age emergencyPhone role")
    .sort({ createdAt: -1 })
    .limit(100);

    res.json(reds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/admin/users - Admin sees all users
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;