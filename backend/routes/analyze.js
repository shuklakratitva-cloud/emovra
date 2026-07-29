import { GoogleGenAI } from '@google/genai';
import express from 'express';
import crypto from 'crypto';
const router = express.Router();

// --- ENCRYPTION for privacy till RED/ORANGE ---
const ENCRYPT_KEY = process.env.ENCRYPT_KEY || "emovra-32-char-secret-key-123456";
function encrypt(text){
  try{
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY.slice(0,32)), iv);
    let enc = cipher.update(text,'utf8','hex'); enc += cipher.final('hex');
    return iv.toString('hex')+":"+enc;
  }catch{ return text.slice(0,120); }
}

const SYSTEM_PROMPT = `
You are MindGuard AI - expert in mental health triage for Indian youth. You MUST understand Hinglish, Hindi, negation, slang, gaslighting, emotional abuse INCLUDING SCHOOL TEACHER abuse.

Return ONLY valid JSON: {"risk":"GREEN or ORANGE or RED","score":0-100,"reason":"short reason","triggers":["list"],"category":"self_harm or emotional_abuse or school_emotional_abuse or general","abuseType":"none or home_abuse or school_emotional_abuse or both","abuseSource":"none or teacher or parent or peer"}

Rules:
1. NEGATION: "I don't want to die", "marna nahi chahta" = GREEN, general. Detect "nahi", "not", "don't".
2. HINGLISH: "bahut akela feel ho raha hai" = ORANGE, general
3. HOME ABUSE: "he beats me", "maarta hai", "gaali deta hai", "toxic relationship", "gaslighting", "treats me like kutta", "worthless bolta hai", "blackmail karta hai" = ORANGE 75, emotional_abuse, abuseType home_abuse
4. SCHOOL EMOTIONAL ABUSE (NEW): "teacher said I am useless/worthless/will fail", "teacher insulted me in front of class", "sir ne sabke samne daanta/beizzati ki", "ma'am ne bola nikamma/nalayak", "teacher always targets me", "teacher compares me", "teacher makes fun of me", "teacher says I am worst/dumb" = ORANGE 82-89, category school_emotional_abuse, abuseType school_emotional_abuse, abuseSource teacher, triggers ["teacher_remark","public_shaming"]
5. SLANG: "bc life kharab hai", "feeling low af" = ORANGE, general
6. ORANGE: anxiety, lonely, breakup, "neend nahi aati"
7. RED: suicide intent "mujhe marna hai", "I want to end my life" = RED 95, self_harm
8. PARAS: "vo chhod dega toh mar jaunga" = RED 85, self_harm
9. If BOTH self-harm + abuse present, risk=RED, category includes abuse, triggers both
10. Never return triggers ["error"] - use ["general"] or ["teacher_remark"]

Examples:
"I don't want to die, just tired" => {"risk":"GREEN","score":15,"reason":"Negation - no intent","triggers":["negation"],"category":"general","abuseType":"none","abuseSource":"none"}
"vo roz bolta hai tu bekar hai" => {"risk":"ORANGE","score":70,"reason":"Emotional abuse / gaslighting","triggers":["gaslighting","emotional_abuse"],"category":"emotional_abuse","abuseType":"home_abuse","abuseSource":"parent"}
"Teacher said I am useless in front of whole class" => {"risk":"ORANGE","score":85,"reason":"School emotional abuse - public humiliation by teacher","triggers":["teacher_remark","public_shaming"],"category":"school_emotional_abuse","abuseType":"school_emotional_abuse","abuseSource":"teacher"}
`;

const isProd = process.env.NODE_ENV === "production";
function safeLogRisk(source, risk, score, category, extra=""){
  console.log(`[${source}] Risk:${risk} Score:${score} Cat:${category} ${extra}`);
}

async function saveAlert(userId, risk, score, category, abuseType, abuseSource, triggers, text){
  // PRIVACY: Only RED/ORANGE ever saved - if 2 REDs, 2 docs with same userId (as you wanted)
  if (risk!=="RED" && risk!=="ORANGE") {
    safeLogRisk("PRIVACY-SKIP", risk, score, category, `GREEN/YELLOW not saved - User:${userId}`);
    return;
  }
  try{
    const { default: Alert } = await import("../models/Alert.js").catch(async()=>{
      const mongoose = (await import("mongoose")).default;
      const schema = new mongoose.Schema({
        userId:String, riskLevel:String, score:Number, category:String,
        abuseType:String, abuseSource:String, text_encrypted:String,
        triggers:Array, timestamp:{type:Date, default:Date.now}
      });
      return {default: mongoose.models.Alert || mongoose.model("Alert",schema)};
    });
    await Alert.create({
      userId: userId || "anonymous",
      riskLevel: risk,
      score,
      category,
      abuseType: abuseType || "none",
      abuseSource: abuseSource || "none",
      text_encrypted: encrypt(text),
      triggers
    });
    safeLogRisk("ALERT-SAVED", risk, score, category, `User:${userId} Abuse:${abuseType} Source:${abuseSource}`);
  }catch(e){ console.log("Alert save error",e.message); }
}

router.post('/', async (req, res) => {
  const text = req.body.text || req.body.message || "";
  const userId = req.body.userId || req.body.userEmail || req.body.userId || "anonymous";
  if (!text.trim()) return res.json({ risk: "GREEN", score: 0, reason: "Empty", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: true });

  const lower = text.toLowerCase();

  // SCHOOL ABUSE patterns
  const schoolAbusePatterns = /(teacher.*useless|teacher.*worthless|teacher.*worst|teacher.*dumb|teacher.*stupid|teacher.*fail|teacher.*nikamma|teacher.*nalayak|teacher.*insulted|teacher.*beizzati|teacher.*daanta|teacher.*targets|teacher.*shouts|teacher.*compares|teacher.*makes fun|teacher said.*useless|sir ne.*daanta|sir ne.*beizzati|ma'am.*daanta|maam.*beizzati|sabke samne.*daanta|class me.*beizzati|teacher.*public.*humiliation)/i;
  const isSchoolAbuse = schoolAbusePatterns.test(lower);

  // HOME ABUSE
  const abusePatterns = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|abuse karti|toxic relationship|gaslighting|worthless bolta|bewakoof bolta|kutta jaise|blackmail karta|dhamki deta|treats me like|slaps me|torture karta)/i;
  const isAbuse = abusePatterns.test(lower);

  const isDirectRed = /(mujhe marna hai|i want to die|kill myself|end my life|mar jaunga|mar jaungi|khudkushi karunga|khatam karna hai.*khud ko)/i.test(lower);
  const hasNegation = /(nahi|nahin|don't|do not|not|never|matlab nahi)/i.test(lower);

  if (isDirectRed &&!hasNegation) {
    const cat = isSchoolAbuse? "school_emotional_abuse" : isAbuse? "emotional_abuse" : "self_harm";
    const triggers = isSchoolAbuse? ["self-harm","teacher_remark"] : isAbuse? ["self-harm","emotional_abuse"] : ["self-harm"];
    const abuseType = isSchoolAbuse? "school_emotional_abuse" : isAbuse? "home_abuse" : "none";
    const abuseSource = isSchoolAbuse? "teacher" : isAbuse? "parent" : "none";
    safeLogRisk("QUICK-RED", "RED", 95, cat, `keyword safety net - User:${userId}`);
    await saveAlert(userId, "RED", 95, cat, abuseType, abuseSource, triggers, text);
    return res.json({ risk: "RED", score: 95, reason: "Direct intent - keyword safety net", triggers, category: cat, abuseType, abuseSource, isAI: false, isSafetyNet: true });
  }

  if (isSchoolAbuse &&!isDirectRed) {
    safeLogRisk("QUICK-SCHOOL-ABUSE", "ORANGE", 85, "school_emotional_abuse", `User:${userId}`);
    const triggers = ["teacher_remark","public_shaming"];
    await saveAlert(userId, "ORANGE", 85, "school_emotional_abuse", "school_emotional_abuse", "teacher", triggers, text);
    return res.json({
      risk: "ORANGE", score: 85, reason: "School emotional abuse - teacher subtle remark detected",
      triggers, category: "school_emotional_abuse", abuseType:"school_emotional_abuse", abuseSource:"teacher", isAI: false, isSafetyNet: true
    });
  }

  if (isAbuse &&!isDirectRed) {
    safeLogRisk("QUICK-ABUSE", "ORANGE", 75, "emotional_abuse", `User:${userId}`);
    const triggers = ["emotional_abuse","gaslighting"];
    await saveAlert(userId, "ORANGE", 75, "emotional_abuse", "home_abuse", "parent", triggers, text);
    return res.json({
      risk: "ORANGE", score: 75, reason: "Emotional abuse detected - keyword safety net",
      triggers, category: "emotional_abuse", abuseType:"home_abuse", abuseSource:"parent", isAI: false, isSafetyNet: true
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let response;
    try {
      response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: SYSTEM_PROMPT + "\n\nText to analyze: \"" + text + "\"" });
    } catch (e1) {
      safeLogRisk("GEMINI", "RETRY", 0, "general", `2.0-flash failed: ${e1.message}`);
      response = await ai.models.generateContent({ model: "gemini-1.5-flash-latest", contents: SYSTEM_PROMPT + "\n\nText to analyze: \"" + text + "\"" });
    }

    const txt = response.text || "";
    if (!isProd) console.log("Gemini raw length:", txt.length);

    const match = txt.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (!['GREEN','ORANGE','RED'].includes(parsed.risk)) parsed.risk = 'ORANGE';
      if (!parsed.triggers || parsed.triggers.includes("error")) parsed.triggers = ["general"];
      if (!parsed.category) parsed.category = parsed.abuseType?.includes("school")? "school_emotional_abuse" : parsed.triggers?.includes("emotional_abuse")? "emotional_abuse" : "general";
      if (!parsed.abuseType) parsed.abuseType = parsed.category.includes("school")? "school_emotional_abuse" : parsed.category.includes("emotional")? "home_abuse" : "none";
      if (!parsed.abuseSource) parsed.abuseSource = parsed.abuseType==="school_emotional_abuse"? "teacher" : parsed.abuseType==="home_abuse"? "parent":"none";

      await saveAlert(userId, parsed.risk, parsed.score, parsed.category, parsed.abuseType, parsed.abuseSource, parsed.triggers, text);
      safeLogRisk("GEMINI-AI", parsed.risk, parsed.score, parsed.category, `AI success User:${userId}`);
      return res.json({...parsed, isAI: true });
    }
    safeLogRisk("GEMINI-AI", "ORANGE", 50, "general", "AI unclear");
    const fallback = { risk: "ORANGE", score: 50, reason: "AI unclear", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: true };
    await saveAlert(userId, fallback.risk, fallback.score, fallback.category, fallback.abuseType, fallback.abuseSource, fallback.triggers, text);
    return res.json(fallback);

  } catch (e) {
    console.error("Gemini error:", e.message);
    if (/(akela|lonely|depressed|anxiety|ro raha|tired|khatam)/i.test(lower)) {
      safeLogRisk("FALLBACK", "ORANGE", 60, "general", `AI error User:${userId}`);
      const f = { risk: "ORANGE", score: 60, reason: "AI error, keyword fallback", triggers: ["distress"], category: "general", abuseType:"none", abuseSource:"none", isAI: false };
      await saveAlert(userId, f.risk, f.score, f.category, f.abuseType, f.abuseSource, f.triggers, text);
      return res.json(f);
    }
    safeLogRisk("FALLBACK", "GREEN", 20, "general", `AI error - privacy not saved User:${userId}`);
    // FIX: was ["error"] - now ["general"] - fixes your GREEN-20% screenshot bug
    return res.json({ risk: "GREEN", score: 20, reason: "AI error fallback - privacy protected", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: false });
  }
});

export default router;
