import express from "express";
import Entry from "../models/Entry.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// GET /api/admin/reds - THIS IS THE CODE YOU ASKED
router.get("/reds", auth, isAdmin, async (req, res) => {
  try {
    // Find all critical entries with user data
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

// Optional: get all users
router.get("/users", auth, isAdmin, async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

export default router;