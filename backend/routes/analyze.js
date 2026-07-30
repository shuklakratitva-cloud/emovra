import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import crypto from 'crypto';
import Otp from '../models/otp.js';
import optionalAuth from '../middleware/optionalAuth.js';
import { saveAnalysis } from '../utils/saveAnalysis.js';
import { localRiskFallback } from '../utils/localRiskFallback.js';
import { alertGeminiDown } from '../utils/alertEmail.js';

const router = express.Router();

// Per your request: standardized on gemini-1.5-flash everywhere in this
// backend (was mixed 1.5/2.0 across files). NOTE: your Render logs show
// "429 Too Many Requests ... exceeded your current quota" - that's a
// billing/plan-level limit on the Gemini API key itself, not a bug in this
// code, and switching models alone won't fix it if the 1.5 quota is also
// exhausted. The real fix below is that a Gemini failure (quota or
// otherwise) no longer silently reports GREEN - see localRiskFallback.js.
const GEMINI_MODEL = "gemini-1.5-flash";

// Simple cooldown so a quota outage doesn't retry Gemini on every single
// request (each one still failing) - after 2 back-to-back failures we stop
// calling Gemini for 2 minutes and go straight to the local fallback.
let geminiFailStreak = 0;
let geminiCooldownUntil = 0;

const SYSTEM_PROMPT = `
You are MindGuard AI - expert in mental health triage for Indian youth. You MUST understand Hinglish, Hindi, negation, slang, gaslighting, emotional abuse INCLUDING SCHOOL TEACHER abuse. You must also recognize modern Hinglish/English abusive slang (profanity, slurs) as signs of anger/distress, not just self-harm phrases.

Return ONLY valid JSON: {"risk":"GREEN or ORANGE or RED","score":0-100,"reason":"short reason","triggers":["list"],"category":"self_harm or emotional_abuse or school_emotional_abuse or general","abuseType":"none or home_abuse or school_emotional_abuse or both","abuseSource":"none or teacher or parent or peer"}

Rules:
1. NEGATION: "I don't want to die", "marna nahi chahta" = GREEN, general. Detect "nahi", "not", "don't".
2. HINGLISH: "bahut akela feel ho raha hai" = ORANGE, general
3. HOME ABUSE: "he beats me", "maarta hai", "gaali deta hai", "toxic relationship", "gaslighting", "treats me like kutta", "worthless bolta hai", "blackmail karta hai" = ORANGE 75, emotional_abuse, abuseType home_abuse
4. SCHOOL EMOTIONAL ABUSE: ONLY when a teacher/sir/ma'am/school-staff figure is clearly and specifically named as the source of a demeaning remark or public humiliation - e.g. "teacher said I am useless/worthless/will fail", "teacher insulted me in front of class", "sir ne sabke samne daanta/beizzati ki", "ma'am ne bola nikamma/nalayak", "teacher always targets me", "teacher compares me", "teacher makes fun of me". Do NOT classify as school_emotional_abuse just because the word "teacher" appears somewhere in an unrelated sentence, or because school/exams are mentioned without an actual demeaning remark attributed to a teacher. = ORANGE 82-89, category school_emotional_abuse, abuseType school_emotional_abuse, abuseSource teacher, triggers ["teacher_remark","public_shaming"]
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
"My teacher assigned homework and I feel stressed about exams" => {"risk":"ORANGE","score":40,"reason":"Exam stress - not abuse, teacher just mentioned in passing","triggers":["stress"],"category":"general","abuseType":"none","abuseSource":"none"}
`;

function safeLogRisk(source, risk, score, category, extra=""){
  console.log(`[${source}] Risk:${risk} Score:${score} Cat:${category} ${extra}`);
}

// FIX: tightened so "teacher" appearing anywhere far from a demeaning word
// no longer matches. Requires the demeaning word within ~40 chars of the
// teacher/sir/ma'am mention, in the same clause. This was previously
// something like /teacher.*useless|teacher.*fail|.../ which - because `.`
// matches almost anything - could match "teacher" and "fail" appearing
// anywhere at all in a long message, even about unrelated things.
const schoolAbusePatterns = /\b(teacher|sir|ma'?am|madam)\b[^.!?\n]{0,40}\b(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|insult(ed)?|beizzati|daant(a|i)?|target(s|ed)?|shout(s|ed|ing)?|compar(es|ed|ing)|makes? fun|public(ly)?)\b|\b(sabke samne|class me|public(ly)?)\b[^.!?\n]{0,40}\b(daant|beizzati|insult|shame|humiliat)/i;

// --- OTP/TOP VERIFICATION SYSTEM - Random every time ---
// (Note: routes/otp.js at /api/otp/* is the canonical, hardened OTP flow -
// this one is kept only for backward compatibility with anything already
// calling /api/analyze/otp/*.)
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: "Phone required" });

    await Otp.deleteMany({ phone });

    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP-SEND] Phone:${phone} OTP:${randomOtp}`);

    await Otp.create({ phone, otp: randomOtp });

    res.json({ msg: "OTP sent", phone, otp: randomOtp, expiresIn: 300 });
  } catch(e) {
    res.status(500).json({ msg: "OTP send failed", error: e.message });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone ||!otp) return res.status(400).json({ msg: "Phone and OTP required" });

    const found = await Otp.findOne({ phone, otp });
    if (!found) {
      safeLogRisk("OTP-FAIL", "VERIFY", 0, "general", `Phone:${phone} OTP:${otp} invalid`);
      return res.status(400).json({ verified: false, msg: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ phone });
    safeLogRisk("OTP-SUCCESS", "VERIFY", 100, "general", `Phone:${phone} verified`);

    try {
      const mongoose = (await import("mongoose")).default;
      if (mongoose.models.User) {
        await mongoose.models.User.updateOne({ phone }, { $set: { phoneVerified: true, phone } });
      }
    } catch {}

    res.json({ verified: true, phone, msg: "Phone verified successfully" });
  } catch(e) {
    res.status(500).json({ verified: false, msg: "Verify failed", error: e.message });
  }
});

router.post('/', optionalAuth, async (req, res) => {
  const text = req.body.text || req.body.message || "";
  // Prefer the real authenticated user id (from optionalAuth) so
  // admin-panel populate() can show name/email/emergency contact. Falls
  // back to whatever the client sent, or "anonymous".
  const userId = req.user?.id || req.body.userId || req.body.userEmail || "anonymous";
  const userPhone = req.body.phone || req.body.userPhone || "";
  if (!text.trim()) return res.json({ risk: "GREEN", score: 0, reason: "Empty", triggers: ["general"], category: "general", abuseType:"none", abuseSource:"none", isAI: true });

  const lower = text.toLowerCase();

  // === QUICK SAFETY NETS - NO GEMINI NEEDED ===
  const isDirectRed = /(mujhe marna hai|i want to die|kill myself|end my life|mar jaunga|mar jaungi|khudkushi karunga|khatam karna hai.*khud ko)/i.test(lower);
  const hasNegation = /(nahi|nahin|don't|do not|not|never|matlab nahi)/i.test(lower) &&!lower.includes("nahi jee paunga");
  const isSchoolAbuse = schoolAbusePatterns.test(lower);
  const abusePatterns = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|toxic relationship|gaslighting|worthless bolta|kutta jaise|blackmail karta|slaps me)/i;
  const isAbuse = abusePatterns.test(lower);
  const isAnxious = /(anxious|anxiety|panic|lonely|alone|akela|depressed|depression|stress|overwhelm|neend nahi|nervous|scared|worried|tension|bechain|low|upset|sad)/i.test(lower);

  if (isDirectRed &&!hasNegation) {
    const cat = isSchoolAbuse? "school_emotional_abuse" : isAbuse? "emotional_abuse" : "self_harm";
    const triggers = isSchoolAbuse? ["self-harm","teacher_remark"] : isAbuse? ["self-harm","emotional_abuse"] : ["self-harm"];
    const abuseType = cat==="school_emotional_abuse"?"school_emotional_abuse":cat==="emotional_abuse"?"home_abuse":"none";
    const abuseSource = isSchoolAbuse?"teacher":isAbuse?"parent":"none";
    await saveAnalysis({ userId, text, risk:"RED", score:95, category:cat, abuseType, abuseSource, triggers, emotion:"critical", phone:userPhone });
    return res.json({ risk: "RED", score: 95, reason: "Direct intent - safety net", triggers, category: cat, abuseType, abuseSource, isAI: false, isSafetyNet: true });
  }

  if (isSchoolAbuse) {
    const triggers = ["teacher_remark","public_shaming"];
    await saveAnalysis({ userId, text, risk:"ORANGE", score:85, category:"school_emotional_abuse", abuseType:"school_emotional_abuse", abuseSource:"teacher", triggers, emotion:"humiliated", phone:userPhone });
    return res.json({ risk: "ORANGE", score: 85, reason: "School emotional abuse - teacher remark", triggers, category: "school_emotional_abuse", abuseType:"school_emotional_abuse", abuseSource:"teacher", isAI: false, isSafetyNet: true });
  }

  if (isAbuse) {
    const triggers = ["emotional_abuse","gaslighting"];
    await saveAnalysis({ userId, text, risk:"ORANGE", score:75, category:"emotional_abuse", abuseType:"home_abuse", abuseSource:"parent", triggers, emotion:"distressed", phone:userPhone });
    return res.json({ risk: "ORANGE", score: 75, reason: "Emotional abuse - safety net", triggers, category: "emotional_abuse", abuseType:"home_abuse", abuseSource:"parent", isAI: false, isSafetyNet: true });
  }

  if (isAnxious) {
    const triggers = ["anxiety","distress"];
    await saveAnalysis({ userId, text, risk:"ORANGE", score:68, category:"general", abuseType:"none", abuseSource:"none", triggers, emotion:"anxious", phone:userPhone });
    return res.json({ risk: "ORANGE", score: 68, reason: "Anxiety/distress keyword", triggers, category: "general", abuseType:"none", abuseSource:"none", isAI: false, isSafetyNet: true });
  }

  // === GEMINI ===
  const inCooldown = Date.now() < geminiCooldownUntil;

  if (!inCooldown) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(SYSTEM_PROMPT + "\n\nText: \"" + text + "\"");
      const txt = result.response.text() || "";
      const match = txt.match(/\{[\s\S]*\}/);

      geminiFailStreak = 0; // success - reset

      if (match) {
        const parsed = JSON.parse(match[0]);
        if (!['GREEN','ORANGE','RED'].includes(parsed.risk)) parsed.risk = 'ORANGE';
        if (!parsed.triggers || parsed.triggers.includes("error")) parsed.triggers = ["general"];
        if (!parsed.category) parsed.category = parsed.abuseType?.includes("school")? "school_emotional_abuse" : "general";
        if (!parsed.abuseType) parsed.abuseType = parsed.category.includes("school")? "school_emotional_abuse" : "none";
        if (!parsed.abuseSource) parsed.abuseSource = parsed.abuseType==="school_emotional_abuse"? "teacher" : "none";

        await saveAnalysis({ userId, text, risk: parsed.risk, score: parsed.score, category: parsed.category, abuseType: parsed.abuseType, abuseSource: parsed.abuseSource, triggers: parsed.triggers, emotion: parsed.emotion, phone: userPhone });
        safeLogRisk("GEMINI-AI", parsed.risk, parsed.score, parsed.category, `AI success User:${userId}`);
        return res.json({...parsed, isAI: true });
      }

      // Gemini responded but not with parseable JSON - use local fallback rather than guessing
      const fb = localRiskFallback(text);
      await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
      return res.json({ ...fb, reason: "AI response unparseable - local fallback used" });

    } catch (e) {
      console.error("Gemini error:", e.message.slice(0,300));
      geminiFailStreak += 1;
      if (e.message?.includes("429") || e.message?.toLowerCase().includes("quota")) {
        geminiCooldownUntil = Date.now() + 2 * 60 * 1000; // 2 min cooldown on quota errors
        alertGeminiDown(e.message?.slice(0, 200)); // NEW: page the admin instead of taking the site down
      } else if (geminiFailStreak >= 3) {
        geminiCooldownUntil = Date.now() + 60 * 1000;
        alertGeminiDown(e.message?.slice(0, 200));
      }
      // FIX: this used to unconditionally return { risk: "GREEN", score: 20 }
      // here, meaning ANY Gemini failure (including the quota-exceeded
      // errors visible in your Render logs) made every message look safe.
      // Now falls back to a real local classifier instead.
      const fb = localRiskFallback(text);
      await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
      return res.json(fb);
    }
  } else {
    // In cooldown - skip the Gemini call entirely and go straight to local fallback
    const fb = localRiskFallback(text);
    await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
    return res.json({ ...fb, reason: fb.reason + " (Gemini in cooldown after repeated failures)" });
  }
});

export default router;
