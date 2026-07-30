import express from "express";
import { protect as auth } from "../middleware/auth.js";
import Goal from "../models/Goal.js";
import { awardXP } from "../utils/gamification.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load goals" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, targetDate, milestones } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: "Title required" });

    const goal = await Goal.create({
      userId: req.user.id,
      title: title.trim(),
      targetDate: targetDate || null,
      milestones: (milestones || []).map((m) => ({ text: m, done: false })),
    });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create goal" });
  }
});

router.post("/:id/milestone/:index/toggle", auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    const idx = Number(req.params.index);
    if (!goal.milestones[idx]) return res.status(400).json({ success: false, message: "Invalid milestone" });

    goal.milestones[idx].done = !goal.milestones[idx].done;
    const allDone = goal.milestones.length > 0 && goal.milestones.every((m) => m.done);

    let gam = null;
    if (allDone && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
      gam = await awardXP(req.user.id, 20, {});
    } else if (!allDone && goal.completed) {
      goal.completed = false;
      goal.completedAt = null;
    }
    await goal.save();

    res.json({ success: true, goal, gamification: gam });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update milestone" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Goal.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete goal" });
  }
});

export default router;
