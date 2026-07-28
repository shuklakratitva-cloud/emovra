import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Entry from "../models/Entry.js";
import { protect as auth } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/analyze', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Audio file required" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const audioBase64 = req.file.buffer.toString('base64');
    
    const prompt = `
    You are Emovra AI. Transcribe the audio and analyze mental health.
    Return ONLY valid JSON:
    {
      "transcript": "what user said",
      "score": 0-100,
      "riskLevel": "GREEN or ORANGE or RED",
      "emotion": "panic, sad, happy, anxious, etc",
      "reasons": ["reasons"],
      "emoAbuseDetected": true/false,
      "abuseType": "none or emotional etc"
    }
    Rules:
    - panic attack, suicidal, self-harm, can't breathe = RED 90+
    - hopeless, worthless, hit me, abuse, gaslight = ORANGE/RED 60+ and emoAbuseDetected=true
    - happy, fine, okay = GREEN <40
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
    ]);

    let jsonText = result.response.text().replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(jsonText);

    // Save encrypted (using same logic as text)
    const entry = new Entry({
      userId: req.user.id,
      score: analysis.score,
      emotion: analysis.emotion,
      reasons: analysis.reasons,
    });
    entry._plainText = analysis.transcript;
    // emoAbuseDetected will be set in pre-save from transcript
    if (analysis.emoAbuseDetected) entry.emoAbuseDetected = true;
    await entry.save();

    res.json({
      success: true,
      transcript: analysis.transcript,
      riskLevel: entry.riskLevel,
      score: entry.score,
      // emoAbuseDetected NOT sent to frontend - only backend
    });

  } catch (e) {
    console.error("Voice error:", e);
    res.status(500).json({ msg: e.message });
  }
});

export default router;