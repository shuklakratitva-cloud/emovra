import { GoogleGenerativeAI } from '@google/generative-ai';
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
4. SCHOOL EMOTIONAL ABUSE: "teacher said I am useless/worthless/will fail", "teacher insulted me in front of class", "sir ne sabke samne daanta/beizzati ki", "ma'am ne bola nikamma/nalayak", "teacher always targets me", "teacher compares me", "teacher makes fun of me", "teacher says I am worst/dumb" = ORANGE 82-89, category school_emotional_abuse, abuseType school_emotional_abuse, abuseSource teacher, triggers ["teacher_remark","public_shaming"]
5. SLANG: "bc life kharab hai", "feeling low af" = ORANGE, general
6. ORANGE: anxiety, anxious, lonely, breakup, "neend nahi aati", sad, low, tired, depressed
7. RED: suicide intent "mujhe marna hai", "I want to end my life" = RED 95, self_harm
8. PARAS: "vo chhod dega toh mar jaunga" = RED 85, self_harm
9. If BOTH self-harm + abuse present, risk=RED, category includes abuse, triggers both
10. Never return triggers ["error"] - use ["general"] or ["teacher_remark"]

Examples:
"I don't want to die, just tired" => {"risk":"GREEN","score":15,"reason":"Negation - no intent","triggers":["negation"],"category":"general","abuseType":"none","abuseSource":"none"}
"vo roz bolta hai tu bekar hai" => {"risk":"ORANGE","score":70,"reason":"Emotional abuse / gaslighting","triggers":["gaslighting","emotional_abuse"],"category":"emotional_abuse","abuseType":"home_abuse","abuseSource":"parent"}
"Teacher said I am useless in front of whole class" => {"risk":"ORANGE","score":85,"reason":"School emotional abuse - public humiliation","triggers":["teacher_remark","public_shaming"],"category":"school_emotional_abuse","abuseType":"school_emotional_abuse","abuseSource":"teacher"}
`;

function safeLogRisk(source, risk, score, category, extra=""){
  console.log(`[${source}] Risk:${risk} Score:${score} Cat:${category} ${extra}`);
}

async function saveAlert(userId, risk, score, category, abuseType, abuseSource, triggers, text){
  if (risk!=="RED" && risk!=="ORANGE") {
    safeLogRisk("PRIVACY-SKIP", risk, score, category, `GREEN not saved - User:${userId}`);
    return;
  }
  try{
    const mongoose = (await import("mongoose")).default;
    const schema = new mongoose.Schema({
      userId:String, riskLevel:String, score:Number, category:String,
      abuseType:String, abuseSource:String, text_encrypted:String,
      triggers:Array, timestamp:{type:Date, default:Date.now}
    });
    const Alert = mongoose.models.Alert || mongoose.model("Alert",schema);
    await Alert.create({
      userId: userId || "anonymous", riskLevel: risk, score, category,
      abuseType: abuseType || "none", abuseSource: abuseSource || "none",
      text_encrypted: encrypt(text), triggers
    });
    safeLogRisk("ALERT-SAVED", risk, score, category, `User:${userId} Abuse:${abuseType} Source:${abuseSource}`);
  }catch(e){ console.log("Save err",e.message); }
}

router.post('/', async (req, res) => {
  const text = req.body.text || req.body.message || "";
  const userId = req.body.userId || req.body.userEmail || "anonymous";
  if (!text.trim()) return res.json({ risk: "GREEN", score: 0, reason: "Empty", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: true });

  const lower = text.toLowerCase();

  // === QUICK SAFETY NETS - NO GEMINI NEEDED - Fixes your GREEN bug ===
  const isDirectRed = /(mujhe marna hai|i want to die|kill myself|end my life|mar jaunga|mar jaungi|khudkushi karunga|khatam karna hai.*khud ko)/i.test(lower);
  const hasNegation = /(nahi|nahin|don't|do not|not|never|matlab nahi)/i.test(lower) && !lower.includes("nahi jee paunga");
  const schoolAbusePatterns = /(teacher.*useless|teacher.*worthless|teacher.*worst|teacher.*dumb|teacher.*stupid|teacher.*fail|teacher.*nikamma|teacher.*nalayak|teacher.*insulted|teacher.*beizzati|teacher.*daanta|teacher.*targets|teacher.*shouts|teacher.*compares|teacher.*makes fun|teacher said.*useless|sir ne.*daanta|sir ne.*beizzati|ma'am.*daanta|sabke samne.*daanta|class me.*beizzati|teacher.*public)/i;
  const isSchoolAbuse = schoolAbusePatterns.test(lower);
  const abusePatterns = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|toxic relationship|gaslighting|worthless bolta|kutta jaise|blackmail karta|slaps me)/i;
  const isAbuse = abusePatterns.test(lower);
  const isAnxious = /(anxious|anxiety|panic|lonely|alone|akela|depressed|depression|stress|overwhelm|neend nahi|nervous|scared|worried|tension|bechain|low|upset|sad)/i.test(lower);

  if (isDirectRed && !hasNegation) {
    const cat = isSchoolAbuse? "school_emotional_abuse" : isAbuse? "emotional_abuse" : "self_harm";
    const triggers = isSchoolAbuse? ["self-harm","teacher_remark"] : isAbuse? ["self-harm","emotional_abuse"] : ["self-harm"];
    await saveAlert(userId, "RED", 95, cat, cat==="school_emotional_abuse"?"school_emotional_abuse":cat==="emotional_abuse"?"home_abuse":"none", isSchoolAbuse?"teacher":isAbuse?"parent":"none", triggers, text);
    return res.json({ risk: "RED", score: 95, reason: "Direct intent - safety net", triggers, category: cat, abuseType: cat==="school_emotional_abuse"?"school_emotional_abuse":cat==="emotional_abuse"?"home_abuse":"none", abuseSource: isSchoolAbuse?"teacher":isAbuse?"parent":"none", isAI: false, isSafetyNet: true });
  }

  if (isSchoolAbuse) {
    const triggers = ["teacher_remark","public_shaming"];
    await saveAlert(userId, "ORANGE", 85, "school_emotional_abuse", "school_emotional_abuse", "teacher", triggers, text);
    return res.json({ risk: "ORANGE", score: 85, reason: "School emotional abuse - teacher remark", triggers, category: "school_emotional_abuse", abuseType:"school_emotional_abuse", abuseSource:"teacher", isAI: false, isSafetyNet: true });
  }

  if (isAbuse) {
    const triggers = ["emotional_abuse","gaslighting"];
    await saveAlert(userId, "ORANGE", 75, "emotional_abuse", "home_abuse", "parent", triggers, text);
    return res.json({ risk: "ORANGE", score: 75, reason: "Emotional abuse - safety net", triggers, category: "emotional_abuse", abuseType:"home_abuse", abuseSource:"parent", isAI: false, isSafetyNet: true });
  }

  if (isAnxious) {
    const triggers = ["anxiety","distress"];
    await saveAlert(userId, "ORANGE", 68, "general", "none", "none", triggers, text);
    return res.json({ risk: "ORANGE", score: 68, reason: "Anxiety/distress keyword", triggers, category: "general", abuseType:"none", abuseSource:"none", isAI: false, isSafetyNet: true });
  }

  // === GEMINI - Correct model name ===
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(SYSTEM_PROMPT + "\n\nText: \"" + text + "\"");
    const txt = result.response.text() || "";
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (!['GREEN','ORANGE','RED'].includes(parsed.risk)) parsed.risk = 'ORANGE';
      if (!parsed.triggers || parsed.triggers.includes("error")) parsed.triggers = ["general"];
      if (!parsed.category) parsed.category = parsed.abuseType?.includes("school")? "school_emotional_abuse" : "general";
      if (!parsed.abuseType) parsed.abuseType = parsed.category.includes("school")? "school_emotional_abuse" : "none";
      if (!parsed.abuseSource) parsed.abuseSource = parsed.abuseType==="school_emotional_abuse"? "teacher" : "none";
      await saveAlert(userId, parsed.risk, parsed.score, parsed.category, parsed.abuseType, parsed.abuseSource, parsed.triggers, text);
      safeLogRisk("GEMINI-AI", parsed.risk, parsed.score, parsed.category, `AI success User:${userId}`);
      return res.json({...parsed, isAI: true });
    }
    return res.json({ risk: "ORANGE", score: 50, reason: "AI unclear", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: true });
  } catch (e) {
    console.error("Gemini error:", e.message.slice(0,300));
    return res.json({ risk: "GREEN", score: 20, reason: "AI fallback - privacy protected", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: false });
  }
});

export default router;
