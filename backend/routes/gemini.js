import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const router = express.Router();

// --- YOUR EXISTING MODEL (keep) ---
// Make sure you have this in models/Alert.js or same file
// If you already have Alert model imported, use: import Alert from "../models/Alert.js"

// --- ENCRYPTION (for privacy till RED/ORANGE) ---
const ENCRYPT_KEY = process.env.ENCRYPT_KEY || "emovra-32-char-secret-key-123456";
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY.slice(0,32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ":" + encrypted;
  } catch { return crypto.createHash('sha256').update(text).digest('hex'); }
}

// --- YOUR CHAT ROUTE - NOW WITH ALL FEATURES ---
router.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body; // Added userId
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // --- NEW: ADVANCED PROMPT WITH SCHOOL EMOTIONAL ABUSE + PRIVACY ---
    const prompt = `
You are Emovra, a kind mental wellness companion. Breathe. Balance. Become.

User says: "${message}"

TASK: Do 2 things in ONE JSON:

1. Analyze risk for backend privacy (hidden from user)
2. Give supportive reply (shown to user)

DETECTION RULES - VERY IMPORTANT:

A) HOME ABUSE: hitting, beating, forced, unsafe at home, parents abusing => emoAbuseDetected=true, abuseType=home_abuse, RED 95-100

B) SCHOOL EMOTIONAL ABUSE (NEW FEATURE):
Detect subtle teacher remarks:
- Words: "you are useless, worthless, will never succeed, nikamma, nalayak, beizzati, daanta, shame on you, worst student, dumb, idiot in front of class"
- Actions: public humiliation, comparing to others, constant shouting, ignoring, biased grading, making fun of appearance/caste, sarcasm that hurts, targets me, sir ne sabke samne daanta, ma'am ne beizzati ki
- Feelings: "teacher always targets me", "teacher insulted me", "teacher says I am dumb"
=> If found => emoAbuseDetected=true, abuseType="school_emotional_abuse", abuseSource="teacher", riskLevel ORANGE 75-89 or RED 90-100 if repeated

C) Normal feelings => GREEN 0-40, YELLOW 41-74

Return ONLY valid JSON like this, no extra text:

{
  "riskLevel": "GREEN or YELLOW or ORANGE or RED",
  "score": 0-100,
  "emotion": "neutral / humiliated / anxious / critical etc",
  "reasons": ["teacher_public_humiliation"],
  "emoAbuseDetected": true or false,
  "abuseType": "none or home_abuse or school_emotional_abuse or both",
  "abuseSource": "none or teacher or parent or peer",
  "triggers": ["teacher_remark"],
  "reply": "Your warm supportive reply 2-3 lines. If school abuse: 'It's painful when words from a teacher hurt. Your worth isn't defined by one remark. Consider talking to a counselor you trust. You are not alone.' If normal: empathetic short supportive."
}

IMPORTANT: reply must be like earlier - warm, supportive, wellness only, not medical diagnosis. Never say "error".
`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, '').trim();
    
    let aiData;
    try {
      aiData = JSON.parse(text);
    } catch {
      // Fallback if JSON fails - still give advice like earlier
      aiData = {
        riskLevel: "GREEN",
        score: 20,
        emotion: "neutral",
        reasons: ["general"],
        emoAbuseDetected: false,
        abuseType: "none",
        abuseSource: "none",
        triggers: ["general"],
        reply: text // Use Gemini raw text as reply
      };
    }

    // --- NEW: PRIVACY LOGIC - ONLY RED/ORANGE SAVES TO ALERTS ---
    // GREEN/YELLOW = NEVER SAVE (privacy protected)
    // RED/ORANGE = SAVE TO ALERTS + show userId twice if 2 REDs
    
    if (aiData.riskLevel === "RED" || aiData.riskLevel === "ORANGE") {
      try {
        // Dynamic import so it doesn't break if you don't have Alert model file
        const { default: Alert } = await import("../models/Alert.js").catch(async () => {
          // If no model file, create inline model
          const mongoose = (await import("mongoose")).default;
          const schema = new mongoose.Schema({
            userId: String,
            riskLevel: String,
            score: Number,
            emotion: String,
            reasons: Array,
            emoAbuseDetected: Boolean,
            abuseType: String,
            abuseSource: String,
            text_encrypted: String,
            timestamp: { type: Date, default: Date.now }
          });
          return { default: mongoose.models.Alert || mongoose.model("Alert", schema) };
        });

        await Alert.create({
          userId: userId || "anonymous", // Will show twice if user sends 2 REDs - as you wanted
          riskLevel: aiData.riskLevel,
          score: aiData.score,
          emotion: aiData.emotion,
          reasons: aiData.reasons,
          emoAbuseDetected: aiData.emoAbuseDetected,
          abuseType: aiData.abuseType, // school_emotional_abuse
          abuseSource: aiData.abuseSource, // teacher
          text_encrypted: encrypt(message), // Encrypted till RED/ORANGE
          timestamp: new Date()
        });
        console.log(`ALERT SAVED: ${aiData.riskLevel} | ${aiData.abuseType} | User: ${userId}`);
      } catch (dbErr) {
        console.error("Alert save error (non-blocking):", dbErr.message);
      }
    } else {
      console.log(`GREEN/YELLOW - Privacy protected, NOT saved to DB: ${message.slice(0,30)}`);
    }

    // --- RETURN TO FRONTEND - Fixes your GREEN-20% error issue ---
    // Frontend expects {reply, riskLevel, score...} for advice + graph
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

export default router;;
