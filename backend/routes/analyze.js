import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import crypto from 'crypto';
import Otp from '../models/otp.js';
import optionalAuth from '../middleware/optionalAuth.js';
import { saveAnalysis } from '../utils/saveAnalysis.js';
import { localRiskFallback } from '../utils/localRiskFallback.js';
import { alertGeminiDown } from '../utils/alertEmail.js';
import { callGeminiResilient, isSelfThrottled } from '../utils/geminiThrottle.js';
import { classifyWithGroq } from '../utils/groqFallback.js';

const router = express.Router();

// UPDATE (confirmed via your Render logs): the real, root-cause problem
// this whole time was that "gemini-1.5-flash" is a RETIRED model - every
// call was getting a 404 "model not found", not a quota error. Standardized
// on "gemini-3.5-flash-lite" instead - Google's current low-latency,
// high-volume classification model as of when this was fixed (July 2026).
// If Gemini calls start failing again in the future, check
// https://ai.google.dev/gemini-api/docs/changelog first for a newer
// deprecation before assuming it's a code bug - Google retires models on
// its own schedule, sometimes with only a few months' notice.
const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Simple cooldown so a quota outage doesn't retry Gemini on every single
// request (each one still failing) - after 2 back-to-back failures we stop
// calling Gemini for 2 minutes and go straight to the local fallback.
let geminiFailStreak = 0;
let geminiCooldownUntil = 0;

export const SYSTEM_PROMPT = `
You are MindGuard AI - expert in mental health triage for Indian youth. You MUST understand Hinglish, Hindi, negation, slang, gaslighting, emotional abuse INCLUDING SCHOOL TEACHER abuse. You must also recognize modern Hinglish/English abusive slang (profanity, slurs) as signs of anger/distress, not just self-harm phrases.

Return ONLY valid JSON: {"risk":"GREEN or YELLOW or ORANGE or RED","score":0-100,"reason":"short reason","triggers":["list"],"category":"self_harm or emotional_abuse or school_emotional_abuse or general","abuseType":"none or home_abuse or school_emotional_abuse or both","abuseSource":"none or teacher or parent or peer"}

Rules:
1. NEGATION: "I don't want to die", "marna nahi chahta" = GREEN, general. Detect "nahi", "not", "don't".
2. YELLOW (score 30-50): mild, vague, everyday unease with no specific trigger or intensity - "feeling a bit off today", "not really sure why I'm tired", "kal se thoda low feel ho raha hai", "bas aisa hi din tha", mild boredom/meh mood. This is a real, distinct band between GREEN (genuinely fine) and ORANGE (clear distress) - don't skip straight from one to the other just because the message isn't strongly worded either way.
3. HINGLISH (clearer distress): "bahut akela feel ho raha hai" = ORANGE, general
4. HOME ABUSE: "he beats me", "maarta hai", "gaali deta hai", "toxic relationship", "gaslighting", "treats me like kutta", "worthless bolta hai", "blackmail karta hai" = ORANGE 75, emotional_abuse, abuseType home_abuse
5. SCHOOL EMOTIONAL ABUSE: ONLY when a teacher/sir/ma'am/school-staff figure is clearly and specifically named as the source of a demeaning remark or public humiliation - e.g. "teacher said I am useless/worthless/will fail", "teacher insulted me in front of class", "sir ne sabke samne daanta/beizzati ki", "ma'am ne bola nikamma/nalayak", "teacher always targets me", "teacher compares me", "teacher makes fun of me". Do NOT classify as school_emotional_abuse just because the word "teacher" appears somewhere in an unrelated sentence, or because school/exams are mentioned without an actual demeaning remark attributed to a teacher. = ORANGE 82-89, category school_emotional_abuse, abuseType school_emotional_abuse, abuseSource teacher, triggers ["teacher_remark","public_shaming"]
6. SLANG: "bc life kharab hai", "feeling low af" = ORANGE, general
7. ORANGE (score 60-89, clear/specific distress): explicit anxiety, "I feel anxious/anxious about X", explicit loneliness ("I feel so alone"), breakup, "neend nahi aati", combined sad+low, tired framed as exhausted/burnt out, explicit depressed
8. RED: suicide intent "mujhe marna hai", "I want to end my life" = RED 95, self_harm
9. PARAS: "vo chhod dega toh mar jaunga" = RED 85, self_harm
10. If BOTH self-harm + abuse present, risk=RED, category includes abuse, triggers both
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

// NEW: third tier in the chain - Keywords (instant) -> Gemini -> Groq ->
// local keyword classifier (final resort). Only reached when Gemini has
// already failed or is in cooldown. Returns the classification result if
// Groq succeeds, or null if Groq also fails/isn't configured - callers
// fall through to localRiskFallback on null, same as any other AI failure.
async function tryGroqClassification(text) {
  const groqResult = await classifyWithGroq(SYSTEM_PROMPT, text);
  if (!groqResult) return null;
  return { ...groqResult, isAI: true, source: "groq-fallback" };
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
    // FIX (NoSQL injection): phone/otp previously went directly into
    // Otp.findOne({ phone, otp }) with no type check. Sending
    // {"otp": {"$ne": null}} instead of a string would make MongoDB treat
    // it as a query operator - matching ANY existing OTP for that phone,
    // completely bypassing verification. Reject non-strings outright.
    if (typeof phone !== "string" || typeof otp !== "string" || !phone || !otp) {
      return res.status(400).json({ msg: "Phone and OTP required" });
    }

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
  // FIX: this used to also match "low", "sad", "upset", and "alone" -
  // words that show up constantly in completely mundane sentences
  // ("battery is low", "I was alone at home", "a bit sad about the
  // movie ending"). Any match here short-circuits straight to a
  // hardcoded ORANGE 68 WITHOUT ever calling the AI - meaning YELLOW
  // could never be reached for any message containing these common
  // words, no matter how mild. Narrowed to genuinely concerning terms
  // only; milder/ambiguous language now correctly falls through to the
  // AI, where the YELLOW band actually exists and can be judged with
  // real context instead of a blunt keyword match.
  const isAnxious = /(anxious|anxiety|panic|lonely|akela|depressed|depression|\bstress\b|overwhelm|neend nahi|nervous|scared|worried|tension|bechain)/i.test(lower);

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
      // NEW: self-throttles if near GEMINI_MAX_RPM, retries once for
      // transient (non-quota) errors before giving up - reduces how often
      // we fall back without ever removing the fallback itself.
      const result = await callGeminiResilient(() =>
        model.generateContent(SYSTEM_PROMPT + "\n\nText: \"" + text + "\"")
      );
      const txt = result.response.text() || "";
      const match = txt.match(/\{[\s\S]*\}/);

      geminiFailStreak = 0; // success - reset

      if (match) {
        const parsed = JSON.parse(match[0]);
        if (!['GREEN','YELLOW','ORANGE','RED'].includes(parsed.risk)) parsed.risk = 'ORANGE';
        if (!parsed.triggers || parsed.triggers.includes("error")) parsed.triggers = ["general"];
        if (!parsed.category) parsed.category = parsed.abuseType?.includes("school")? "school_emotional_abuse" : "general";
        if (!parsed.abuseType) parsed.abuseType = parsed.category.includes("school")? "school_emotional_abuse" : "none";
        if (!parsed.abuseSource) parsed.abuseSource = parsed.abuseType==="school_emotional_abuse"? "teacher" : "none";

        await saveAnalysis({ userId, text, risk: parsed.risk, score: parsed.score, category: parsed.category, abuseType: parsed.abuseType, abuseSource: parsed.abuseSource, triggers: parsed.triggers, emotion: parsed.emotion, phone: userPhone });
        safeLogRisk("GEMINI-AI", parsed.risk, parsed.score, parsed.category, `AI success User:${userId}`);
        return res.json({...parsed, isAI: true });
      }

      // Gemini responded but not with parseable JSON - try Groq before local fallback
      const groqFb1 = await tryGroqClassification(text);
      if (groqFb1) {
        await saveAnalysis({ userId, text, risk: groqFb1.risk, score: groqFb1.score, category: groqFb1.category, abuseType: groqFb1.abuseType, abuseSource: groqFb1.abuseSource, triggers: groqFb1.triggers, phone: userPhone });
        safeLogRisk("GROQ-AI", groqFb1.risk, groqFb1.score, groqFb1.category, `Gemini unparseable, Groq succeeded User:${userId}`);
        return res.json({ ...groqFb1, reason: groqFb1.reason || "Gemini unparseable - Groq used" });
      }
      const fb = localRiskFallback(text);
      await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
      return res.json({ ...fb, reason: "AI response unparseable - local fallback used" });

    } catch (e) {
      console.error("Gemini error:", e.message.slice(0,300));
      const wasSelfThrottled = e.message?.includes("Self-throttled");
      geminiFailStreak += 1;
      if (e.message?.includes("429") || e.message?.toLowerCase().includes("quota")) {
        geminiCooldownUntil = Date.now() + 2 * 60 * 1000; // 2 min cooldown on quota errors
        alertGeminiDown(e.message?.slice(0, 200)); // NEW: page the admin instead of taking the site down
      } else if (geminiFailStreak >= 3 && !wasSelfThrottled) {
        geminiCooldownUntil = Date.now() + 60 * 1000;
        alertGeminiDown(e.message?.slice(0, 200));
      }
      // FIX: this used to unconditionally return { risk: "GREEN", score: 20 }
      // here, meaning ANY Gemini failure (including the quota-exceeded
      // errors visible in your Render logs) made every message look safe.
      // Chain is now: Gemini fails -> try Groq -> only THEN local fallback.
      const groqFb2 = await tryGroqClassification(text);
      if (groqFb2) {
        await saveAnalysis({ userId, text, risk: groqFb2.risk, score: groqFb2.score, category: groqFb2.category, abuseType: groqFb2.abuseType, abuseSource: groqFb2.abuseSource, triggers: groqFb2.triggers, phone: userPhone });
        safeLogRisk("GROQ-AI", groqFb2.risk, groqFb2.score, groqFb2.category, `Gemini failed, Groq succeeded User:${userId}`);
        return res.json(groqFb2);
      }
      const fb = localRiskFallback(text);
      await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
      return res.json(fb);
    }
  } else {
    // In cooldown - Gemini is skipped entirely, but Groq is unaffected by
    // Gemini's cooldown (different provider), so still worth trying before
    // dropping all the way to the local fallback.
    const groqFb3 = await tryGroqClassification(text);
    if (groqFb3) {
      await saveAnalysis({ userId, text, risk: groqFb3.risk, score: groqFb3.score, category: groqFb3.category, abuseType: groqFb3.abuseType, abuseSource: groqFb3.abuseSource, triggers: groqFb3.triggers, phone: userPhone });
      safeLogRisk("GROQ-AI", groqFb3.risk, groqFb3.score, groqFb3.category, `Gemini in cooldown, Groq succeeded User:${userId}`);
      return res.json(groqFb3);
    }
    const fb = localRiskFallback(text);
    await saveAnalysis({ userId, text, risk: fb.risk, score: fb.score, category: fb.category, abuseType: fb.abuseType, abuseSource: fb.abuseSource, triggers: fb.triggers, phone: userPhone });
    return res.json({ ...fb, reason: fb.reason + " (Gemini in cooldown, Groq also unavailable)" });
  }
});

export default router;
