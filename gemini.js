import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import optionalAuth from "../middleware/optionalAuth.js";
import { saveAnalysis } from "../utils/saveAnalysis.js";
import { localRiskFallback } from "../utils/localRiskFallback.js";
import { alertGeminiDown } from "../utils/alertEmail.js";
import { callGeminiResilient } from "../utils/geminiThrottle.js";
import { GEMINI_MODEL } from "../utils/geminiConfig.js";

const router = express.Router();

router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, userId: bodyUserId } = req.body;
    const userId = req.user?.id || bodyUserId || "anonymous";

    if (!message || !message.trim()) {
      return res.json({
        riskLevel: "GREEN", score: 0, emotion: "neutral", reasons: ["empty"],
        emoAbuseDetected: false, abuseType: "none", abuseSource: "none",
        triggers: ["general"], reply: "I'm listening whenever you're ready."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
You are Emovra, a kind mental wellness companion. Breathe. Balance. Become.

User says: "${message}"

TASK: Do 2 things in ONE JSON:
1. Analyze risk for backend privacy (hidden from user)
2. Give supportive reply (shown to user)

DETECTION RULES:

A) HOME ABUSE: hitting, beating, forced, unsafe at home, parents abusing => emoAbuseDetected=true, abuseType=home_abuse, RED 95-100

B) SCHOOL EMOTIONAL ABUSE: ONLY when a teacher/sir/ma'am is specifically and clearly named as the source of a demeaning remark or public humiliation - words like "you are useless, worthless, nikamma, nalayak, beizzati, daanta"; actions like public humiliation, comparing to others, constant shouting, biased grading, sarcasm that hurts. Do NOT flag this just because school/teacher/exams are mentioned in passing with no actual demeaning remark attributed to a teacher.
=> If genuinely found => emoAbuseDetected=true, abuseType="school_emotional_abuse", abuseSource="teacher", riskLevel ORANGE 75-89 or RED 90-100 if repeated

C) Normal feelings => GREEN 0-40, ORANGE 41-74

Return ONLY valid JSON like this, no extra text:
{
  "riskLevel": "GREEN or ORANGE or RED",
  "score": 0-100,
  "emotion": "neutral / humiliated / anxious / critical etc",
  "reasons": ["teacher_public_humiliation"],
  "emoAbuseDetected": true or false,
  "abuseType": "none or home_abuse or school_emotional_abuse or both",
  "abuseSource": "none or teacher or parent or peer",
  "triggers": ["teacher_remark"],
  "reply": "Your warm supportive reply 2-3 lines. If school abuse: 'It's painful when words from a teacher hurt. Your worth isn't defined by one remark. Consider talking to a counselor you trust. You are not alone.' If normal: empathetic short supportive."
}

IMPORTANT: reply must be warm, supportive, wellness only, not medical diagnosis. Never say "error".
`;

    let aiData;
    try {
      const result = await callGeminiResilient(() => model.generateContent(prompt));
      let text = result.response.text().replace(/```json|```/g, '').trim();
      aiData = JSON.parse(text);
    } catch (aiErr) {
      console.error("Gemini chat error:", aiErr.message?.slice(0, 300));
      if (aiErr.message?.includes("429") || aiErr.message?.toLowerCase().includes("quota")) {
        alertGeminiDown(aiErr.message?.slice(0, 200));
      }
      // FIX: previously fell back to a hardcoded GREEN/20 reply on ANY
      // failure (parse error OR API error, including quota). Now uses the
      // same local fallback as analyze.js.
      const fb = localRiskFallback(message);
      aiData = {
        riskLevel: fb.risk,
        score: fb.score,
        emotion: "neutral",
        reasons: [fb.reason],
        emoAbuseDetected: fb.abuseType !== "none",
        abuseType: fb.abuseType,
        abuseSource: fb.abuseSource,
        triggers: fb.triggers,
        reply: "I'm having trouble connecting to the AI right now, but I heard you. Take a slow breath - you are not alone.",
        category: fb.category,
      };
    }

    // FIX: this used to build its own inline Alert schema (or, if
    // ../models/Alert.js imported fine - which it always does - still tried
    // to save fields like userId/emotion/reasons/abuseType/text_encrypted
    // that the OLD Alert schema didn't define, while never providing the
    // OLD schema's required `user`/`text` fields - so this Alert.create()
    // threw on every single call and was silently swallowed. It also saved
    // every RED/ORANGE to `alerts`, not just school abuse, contradicting
    // the "alerts = classroom abuse only" rule. saveAnalysis() now handles

    await saveAnalysis({
      userId,
      text: message,
      risk: aiData.riskLevel,
      score: aiData.score,
      category: aiData.category || (aiData.abuseType === "school_emotional_abuse" ? "school_emotional_abuse" : aiData.abuseType === "home_abuse" ? "emotional_abuse" : "general"),
      abuseType: aiData.abuseType,
      abuseSource: aiData.abuseSource,
      triggers: aiData.triggers,
      emotion: aiData.emotion,
    });

    res.json({
      reply: aiData.reply,
      riskLevel: aiData.riskLevel,
      score: aiData.score,
      emotion: aiData.emotion,
      emoAbuseDetected: aiData.emoAbuseDetected,
      abuseType: aiData.abuseType,
      triggers: aiData.triggers
    });

  } catch (e) {
    console.error("GEMINI ERROR:", e.message);
    res.status(500).json({
      error: e.message,
      riskLevel: "GREEN",
      score: 20,
      reply: "I'm having trouble connecting right now, but I'm here for you. Take a slow breath. You are not alone. Try again in a moment?"
    });
  }
});

export default router;
