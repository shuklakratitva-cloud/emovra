import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { STRENGTH_QUIZ, scoreQuiz } from "../data/quizzes.js";
import { awardXP } from "../utils/gamification.js";
import { todayIST, toISTDateStr } from "../utils/istDate.js";

const router = express.Router();

router.get("/strength", (req, res) => {
  res.json({ success: true, quiz: { id: STRENGTH_QUIZ.id, title: STRENGTH_QUIZ.title, questions: STRENGTH_QUIZ.questions } });
});

router.post("/strength/submit", auth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ success: false, message: "answers required" });

    const resultKey = scoreQuiz(answers);
    const result = STRENGTH_QUIZ.results[resultKey];

    const existing = await User.findById(req.user.id).select("personalityResult");
    const today = todayIST();
    const alreadyToday = existing?.personalityResult?.takenAt &&
      toISTDateStr(existing.personalityResult.takenAt) === today;

    await User.findByIdAndUpdate(req.user.id, {
      personalityResult: { quizId: STRENGTH_QUIZ.id, resultKey, resultLabel: result.label, takenAt: new Date() },
    });

    const gam = alreadyToday ? null : await awardXP(req.user.id, 10, {});

    res.json({ success: true, result: { key: resultKey, ...result }, gamification: gam });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ success: false, message: "Failed to submit quiz" });
  }
});

export default router;
