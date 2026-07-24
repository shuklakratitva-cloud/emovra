import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import Data from "../models/Data.js";

const router = express.Router();

// GET all RED alerts with participant info - PRIVATE
router.get("/red-codes", authMiddleware, isAdmin, async (req, res) => {
  const reds = await Data.find({ $or: [{ riskLevel: "RED" }, { level: "RED" }] })
    .populate("user", "name email phone emergencyPhone emergency_phone")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, count: reds.length, data: reds });
});

// Clear / resolve a RED code
router.delete("/red-codes/:id", authMiddleware, isAdmin, async (req, res) => {
  await Data.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "RED code cleared" });
});

export default router;