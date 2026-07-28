import { GoogleGenAI } from '@google/genai';
import express from 'express';
const router = express.Router();

const SYSTEM_PROMPT = `
You are MindGuard AI - expert in mental health triage for Indian youth. You MUST understand Hinglish, Hindi, negation, slang, gaslighting.

Return ONLY valid JSON: {"risk":"GREEN or ORANGE or RED","score":0-100,"reason":"short reason in English","triggers":["list"]}

Rules:
1. NEGATION: "I don't want to die", "marna nahi chahta" = GREEN, not RED. Detect "nahi", "not", "don't".
2. HINGLISH: "bahut akela feel ho raha hai", "sab khatam lag raha hai" = ORANGE/RED
3. SLANG/ABUSE EMO: "bc life kharab hai", "feeling low af", "kutta jaise treat karte hai" = ORANGE
4. ORANGE CASES: anxiety, overthinking, lonely, breakup, exam stress, "neend nahi aati", "khana nahi khaya 2 din se"
5. RED CASES: suicide intent, "mujhe marna hai", "I want to end my life", self-harm, "kisi ko maar dunga"
6. GASLIGHTING: "you make me feel worthless", "tu pagal hai, tere wajah se", "everyone says I'm useless" = ORANGE or RED if self-harm link
7. PARAS (parasocial/abandonment): "vo mujhe chhod dega toh mar jaunga", "without her I can't live" = RED

Examples:
Text: "I don't want to die, just tired" => {"risk":"GREEN","score":15,"reason":"Negation - no intent","triggers":["negation"]}
Text: "mujhe marna nahi hai bas akela hu" => {"risk":"ORANGE","score":55,"reason":"Loneliness but negated self-harm","triggers":["lonely","negation"]}
Text: "bc sab khatam ho gaya, akela hu" => {"risk":"ORANGE","score":70,"reason":"Slang + hopelessness + lonely","triggers":["hopelessness","slang"]}
Text: "vo roz bolta hai tu bekar hai, pagal hai" => {"risk":"ORANGE","score":65,"reason":"Gaslighting / emotional abuse","triggers":["gaslighting"]}
Text: "uske bina nahi jee paunga, mar jaunga" => {"risk":"RED","score":85,"reason":"Parasocial dependency with self-harm threat","triggers":["paras","self-harm"]}
Text: "mujhe marna hai" => {"risk":"RED","score":95,"reason":"Direct self-harm intent","triggers":["self-harm"]}
`;

router.post('/', async (req, res) => {
  const text = req.body.text || "";
  if (!text.trim()) return res.json({ risk: "GREEN", score: 0, reason: "Empty" });

  const lower = text.toLowerCase();
  // Quick keyword RED - instant safety
  if (/(mujhe marna hai|i want to die|kill myself|end my life)/i.test(lower) &&!lower.includes("nahi") &&!lower.includes("don't") &&!lower.includes("not")) {
    return res.json({ risk: "RED", score: 95, reason: "Direct intent", triggers: ["self-harm"] });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: SYSTEM_PROMPT + "\n\nText to analyze: \"" + text + "\""
    });

    const txt = response.text || "";
    console.log("Gemini raw:", txt);
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return res.json(parsed);
    }
    return res.json({ risk: "ORANGE", score: 50, reason: "AI unclear", triggers: [] });
  } catch (e) {
    console.error("Gemini error:", e.message);
    return res.json({ risk: "GREEN", score: 20, reason: "AI error fallback", triggers: [] });
  }
});

export default router;