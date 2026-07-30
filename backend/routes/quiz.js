import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { STRENGTH_QUIZ, scoreQuiz } from "../data/quizzes.js";
import { awardXP } from "../utils/gamification.js";

const router = express.Router();

// GET /api/quiz/strength - the quiz questions
router.get("/strength", (req, res) => {
  res.json({ success: true, quiz: { id: STRENGTH_QUIZ.id, title: STRENGTH_QUIZ.title, questions: STRENGTH_QUIZ.questions } });
});

// POST /api/quiz/strength/submit - { answers: { q1: "empath", ... } }
router.post("/strength/submit", auth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ success: false, message: "answers required" });

    const resultKey = scoreQuiz(answers);
    const result = STRENGTH_QUIZ.results[resultKey];

    await User.findByIdAndUpdate(req.user.id, {
      personalityResult: { quizId: STRENGTH_QUIZ.id, resultKey, resultLabel: result.label, takenAt: new Date() },
    });

    const gam = await awardXP(req.user.id, 10, {});

    res.json({ success: true, result: { key: resultKey, ...result }, gamification: gam });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ success: false, message: "Failed to submit quiz" });
  }
});

export default router;
