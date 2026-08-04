import express from "express";
import { protect as auth } from "../middleware/auth.js";
import Habit from "../models/Habit.js";
import { awardXP, todayStr } from "../utils/gamification.js";
import { toISTDateStr } from "../utils/istDate.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id, archived: false }).sort({ createdAt: 1 });
    res.json({ success: true, habits });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load habits" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, emoji } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: "Title required" });
    const habit = await Habit.create({ userId: req.user.id, title: title.trim(), emoji: emoji || "✅" });
    res.status(201).json({ success: true, habit });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create habit" });
  }
});

router.post("/:id/complete", auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ success: false, message: "Habit not found" });

    const today = todayStr();
    if (habit.completions.includes(today)) {
      return res.status(400).json({ success: false, message: "Already completed today" });
    }

    habit.completions.push(today);

    // streak logic for this specific habit
    const yesterday = toISTDateStr(Date.now() - 86400000);
    if (habit.lastCompletedDate === yesterday) habit.streak += 1;
    else habit.streak = 1;
    habit.lastCompletedDate = today;
    habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
    await habit.save();

    const totalCompletions = habit.completions.length;
    const gam = await awardXP(req.user.id, 8, { habitCompletions: totalCompletions });

    res.json({ success: true, habit, ...gam });
  } catch (err) {
    console.error("Complete habit error:", err);
    res.status(500).json({ success: false, message: "Failed to complete habit" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { archived: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: "Habit not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove habit" });
  }
});

export default router;
