import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Entry from "../models/Entry.js";
import { protect as auth } from "../middleware/auth.js";
import { callGeminiResilient } from "../utils/geminiThrottle.js";
import { transcribeWithGroqWhisper, classifyWithGroq } from "../utils/groqFallback.js";
import { localRiskFallback } from "../utils/localRiskFallback.js";
import { SYSTEM_PROMPT } from "./analyze.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// FIX: was gemini-1.5-flash - a RETIRED model (confirmed 404 in your
// Render logs). Updated to the current model, see analyze.js for details.
const GEMINI_MODEL = "gemini-3.5-flash-lite";

const VOICE_PROMPT = `
You are Emovra AI. Transcribe the audio and analyze mental health.
Return ONLY valid JSON:
{
  "transcript": "what user said",
  "score": 0-100,
  "riskLevel": "GREEN or YELLOW or ORANGE or RED",
  "emotion": "panic, sad, happy, anxious, etc",
  "reasons": ["reasons"],
  "emoAbuseDetected": true/false,
  "abuseType": "none or emotional etc"
}
Rules:
- panic attack, suicidal, self-harm, can't breathe = RED 90+
- hopeless, worthless, hit me, abuse, gaslight = ORANGE/RED 60+ and emoAbuseDetected=true
- mild, vague, everyday tiredness or low mood with no specific trigger = YELLOW 30-50
- happy, fine, okay = GREEN <40
`;

// Saves (or correctly skips, per the privacy rule) and responds - shared
// by both the Gemini path and the Groq-fallback path below, so the
// privacy gate and logging can't drift out of sync between the two.
async function finishAndRespond(req, res, analysis, source) {
  const riskLevel = String(analysis.riskLevel || "GREEN").toUpperCase();

  if (riskLevel !== "RED" && riskLevel !== "ORANGE") {
    console.log(`[PRIVACY-SKIP] Voice(${source}) Risk:${riskLevel} Score:${analysis.score} - not saved - User:${req.user.id}`);
    return res.json({ success: true, transcript: analysis.transcript, riskLevel, score: analysis.score });
  }

  const entry = new Entry({
    userId: req.user.id,
    score: analysis.score,
    riskLevel,
    emotion: analysis.emotion,
    reasons: analysis.reasons || [],
  });
  entry._plainText = analysis.transcript;
  if (analysis.emoAbuseDetected) entry.emoAbuseDetected = true;
  await entry.save();
  console.log(`[ENTRY-SAVED] Voice(${source}) Risk:${riskLevel} Score:${analysis.score} - saved to entries - User:${req.user.id}`);

  res.json({ success: true, transcript: analysis.transcript, riskLevel: entry.riskLevel, score: entry.score });
}

router.post('/analyze', auth, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "Audio file required" });

  // TIER 1: Gemini (multimodal - transcribes + classifies in one call)
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const audioBase64 = req.file.buffer.toString('base64');

    const result = await callGeminiResilient(() => model.generateContent([
      { text: VOICE_PROMPT },
      { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
    ]));

    let jsonText = result.response.text().replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(jsonText);
    return await finishAndRespond(req, res, analysis, "gemini");
  } catch (geminiErr) {
    console.error("Voice Gemini tier failed, falling back to Groq Whisper:", geminiErr.message);
  }

  // TIER 2: Groq Whisper transcription + Groq text classification - NEW.
  // Voice analysis previously had zero redundancy (Gemini-only); this
  // gives it a real fallback using the same free Groq tier the text
  // pipeline already relies on.
  try {
    const transcript = await transcribeWithGroqWhisper(req.file.buffer, req.file.mimetype);
    if (!transcript) throw new Error("Groq Whisper returned no transcript");

    const groqResult = await classifyWithGroq(SYSTEM_PROMPT, transcript);
    if (groqResult) {
      return await finishAndRespond(req, res, { ...groqResult, transcript }, "groq-whisper");
    }

    // TIER 3: final-resort local keyword classifier on the Groq transcript
    const fallback = localRiskFallback(transcript);
    return await finishAndRespond(req, res, { ...fallback, transcript }, "local-fallback");
  } catch (fallbackErr) {
    console.error("Voice error (all tiers failed):", fallbackErr.message);
    return res.status(500).json({ msg: "Voice analysis is temporarily unavailable - please try again shortly." });
  }
});

export default router;
