import { GoogleGenAI } from '@google/genai';
import express from 'express';
const router = express.Router();

const SYSTEM_PROMPT = `
You are MindGuard AI - expert in mental health triage for Indian youth. You MUST understand Hinglish, Hindi, negation, slang, gaslighting, emotional abuse.

Return ONLY valid JSON: {"risk":"GREEN or ORANGE or RED","score":0-100,"reason":"short reason","triggers":["list"],"category":"self_harm or emotional_abuse or general"}

Rules:
1. NEGATION: "I don't want to die", "marna nahi chahta" = GREEN, category general. Detect "nahi", "not", "don't".
2. HINGLISH: "bahut akela feel ho raha hai" = ORANGE, category general
3. EMOTIONAL ABUSE (NEW): If user says "he beats me", "maarta hai", "gaali deta hai", "toxic relationship", "gaslighting", "treats me like kutta", "worthless bolta hai", "blackmail karta hai" = ORANGE 75, category emotional_abuse
4. SLANG/ABUSE EMO: "bc life kharab hai", "feeling low af" = ORANGE, category general
5. ORANGE CASES: anxiety, lonely, breakup, "neend nahi aati"
6. RED CASES: suicide intent "mujhe marna hai", "I want to end my life" = RED 95, category self_harm
7. PARAS: "vo chhod dega toh mar jaunga" = RED 85, category self_harm
8. If BOTH self-harm + abuse present, risk=RED, category=emotional_abuse + self_harm in triggers

Examples:
Text: "I don't want to die, just tired" => {"risk":"GREEN","score":15,"reason":"Negation - no intent","triggers":["negation"],"category":"general"}
Text: "vo roz bolta hai tu bekar hai, pagal hai" => {"risk":"ORANGE","score":70,"reason":"Emotional abuse / gaslighting detected","triggers":["gaslighting","emotional_abuse"],"category":"emotional_abuse"}
Text: "my boyfriend beats me and says I'm worthless" => {"risk":"ORANGE","score":78,"reason":"Physical + emotional abuse","triggers":["abuse","emotional_abuse"],"category":"emotional_abuse"}
Text: "uske bina nahi jee paunga, mar jaunga" => {"risk":"RED","score":85,"reason":"Parasocial dependency with self-harm","triggers":["paras","self-harm"],"category":"self_harm"}
`;

router.post('/', async (req, res) => {
  const text = req.body.text || "";
  if (!text.trim()) return res.json({ risk: "GREEN", score: 0, reason: "Empty", triggers: [], category: "general", isAI: true });

  const lower = text.toLowerCase();

  // === STEP 3A: EMOTIONAL ABUSE DETECTION - BEFORE RED CHECK ===
  const abusePatterns = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|abuse karti|toxic relationship|gaslighting|worthless bolta|bewakoof bolta|kutta jaise|blackmail karta|dhamki deta|treats me like|slaps me|torture karta)/i;
  const isAbuse = abusePatterns.test(lower);

  // Quick keyword RED - instant safety
  const isDirectRed = /(mujhe marna hai|i want to die|kill myself|end my life|mar jaunga|mar jaungi|khudkushi karunga|khatam karna hai.*khud ko)/i.test(lower);
  const hasNegation = /(nahi|nahin|don't|do not|not|never|matlab nahi)/i.test(lower);

  // FIXED ERROR 1: Added space in &&!
  if (isDirectRed &&!hasNegation) {
    const cat = isAbuse? "emotional_abuse" : "self_harm";
    const triggers = isAbuse? ["self-harm", "emotional_abuse"] : ["self-harm"];
    return res.json({ risk: "RED", score: 95, reason: "Direct intent - keyword safety net", triggers, category: cat, isAI: false, isSafetyNet: true });
  }

  // If only abuse (no self-harm), return ORANGE with abuse category - INSTANT, no AI call needed
  if (isAbuse &&!isDirectRed) {
    return res.json({
      risk: "ORANGE",
      score: 75,
      reason: "Emotional abuse detected - keyword safety net",
      triggers: ["emotional_abuse", "gaslighting"],
      category: "emotional_abuse",
      isAI: false,
      isSafetyNet: true
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: SYSTEM_PROMPT + "\n\nText to analyze: \"" + text + "\""
      });
    } catch (e1) {
      console.log("2.0-flash failed, trying 1.5-flash-latest:", e1.message);
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents: SYSTEM_PROMPT + "\n\nText to analyze: \"" + text + "\""
      });
    }

    const txt = response.text || "";
    console.log("Gemini raw:", txt);

    const match = txt.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (!['GREEN','ORANGE','RED'].includes(parsed.risk)) parsed.risk = 'ORANGE';
      if (!parsed.category) parsed.category = parsed.triggers?.includes("emotional_abuse")? "emotional_abuse" : "general";
      return res.json({...parsed, isAI: true });
    }
    return res.json({ risk: "ORANGE", score: 50, reason: "AI unclear", triggers: ["unclear"], category: "general", isAI: true });

  } catch (e) {
    console.error("Gemini error:", e.message);
    if (/(akela|lonely|depressed|anxiety|ro raha|tired|khatam)/i.test(lower)) {
      return res.json({ risk: "ORANGE", score: 60, reason: "AI error, keyword fallback", triggers: ["fallback","distress"], category: "general", isAI: false });
    }
    return res.json({ risk: "GREEN", score: 20, reason: "AI error fallback", triggers: ["error"], category: "general", isAI: false });
  }
});

export default router;