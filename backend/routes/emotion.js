import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// FIX: was "gemini-1.5-flash" already here but standardizing explicitly
// alongside analyze.js/gemini.js/voice.js so all four AI routes agree.
const GEMINI_MODEL = "gemini-1.5-flash";

router.post("/analyze", async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, msg: "Text required" });

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `
        Analyze mental health text: "${text}"
        Return ONLY valid JSON, no extra text:
        {
          "color": "GREEN or ORANGE or RED",
          "score": number 0-100 (100 = highest risk),
          "label": "POSITIVE or STRESSED or CRITICAL",
          "emotion": "happy, sad, anxious, panic, depressed, angry, etc",
          "triggers": "short reason",
          "risk": "low or medium or high",
          "emoAbuseDetected": true/false,
          "reasons": ["reason1", "reason2"]
        }
        Rules:
        - "i am having a panic attack, can't breathe, suicide, kill myself, die" = RED, score 90-100, risk high, label CRITICAL
        - "worthless, hate you, emotional abuse, gaslight, beating, hit me, slap, abuse, hopeless, alone" = ORANGE or RED, score 60-85, emoAbuseDetected true if abuse words
        - "sad, stressed, anxious, depressed, crying" = ORANGE, score 45-70, STRESSED, medium
        - "happy, good, fine, great, okay" = GREEN, score 10-30, POSITIVE, low
        - If mixed, take highest risk
        `;

        const result = await model.generateContent(prompt);
        let jsonText = result.response.text().replace(/```json|```/g, "").replace(/```/g, "").trim();
        const ai = JSON.parse(jsonText);

        if (ai.score >= 75) ai.color = "RED";
        else if (ai.score >= 45) ai.color = "ORANGE";
        else ai.color = "GREEN";

        if (ai.color === "RED") { ai.label = "CRITICAL"; ai.risk = "high"; }
        else if (ai.color === "ORANGE") { ai.label = "STRESSED"; ai.risk = "medium"; }
        else { ai.label = "POSITIVE"; ai.risk = "low"; }

        return res.json({
          success: true,
          ...ai,
          isAI: true,
        });

      } catch (geminiErr) {
        console.error("Gemini analyze failed, fallback to keyword:", geminiErr.message);
      }
    }

    // --- Fallback: keyword logic ---
    const low = text.toLowerCase();
    let result = {
      color: "GREEN",
      score: 20,
      label: "POSITIVE",
      emotion: "happy",
      triggers: "none",
      risk: "low",
      emoAbuseDetected: false,
      reasons: ["Positive text detected"]
    };

    const abuseWords = ['worthless','hate you','abuse','beating','hit me','slap','emotional abuse','gaslight','kill you'];
    const isAbuse = abuseWords.some(w => low.includes(w));

    if (low.includes("suicide") || low.includes("kill myself") || low.includes("want to die") || low.includes("panic attack") || low.includes("can't breathe")) {
      result = { color: "RED", score: 95, label: "CRITICAL", emotion: "critical", triggers: "self-harm/panic", risk: "high", emoAbuseDetected: isAbuse, reasons: ["Critical risk detected"] };
    } else if (isAbuse || low.includes("hopeless") || low.includes("worthless")) {
      result = { color: "RED", score: 80, label: "CRITICAL", emotion: "abused", triggers: "emotional abuse", risk: "high", emoAbuseDetected: true, reasons: ["Emotional abuse detected"] };
    } else if (low.includes("sad") || low.includes("stressed") || low.includes("anxious") || low.includes("depressed") || low.includes("alone") || low.includes("crying")) {
      result = { color: "ORANGE", score: 60, label: "STRESSED", emotion: "stressed", triggers: "stress/anxiety", risk: "medium", emoAbuseDetected: isAbuse, reasons: ["Stress/anxiety detected"] };
    }

    res.json({ success: true, ...result, isAI: false });

  } catch (err) {
    console.error("Emotion error:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

export default router;
