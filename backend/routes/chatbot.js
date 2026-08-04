import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import optionalAuth from "../middleware/optionalAuth.js";
import { localRiskFallback } from "../utils/localRiskFallback.js";
import { saveAnalysis } from "../utils/saveAnalysis.js";
import { awardXP } from "../utils/gamification.js";
import { callGeminiResilient } from "../utils/geminiThrottle.js";
import { chatWithGroq } from "../utils/groqFallback.js";
import User from "../models/User.js";
import { todayIST } from "../utils/istDate.js";

const router = express.Router();
const GEMINI_MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `
You are Emovra AI, a warm, curious companion for mental wellness check-ins.
Your job in this conversation: help the person open up a bit more so their
mood/journal entries are understood accurately - NOT to diagnose or lecture.

Rules:
- Keep replies short (2-4 sentences).
- Ask ONE genuine follow-up question per reply when it's natural to (not
  every single time - don't interrogate).
- Be specific to what they actually said, not generic.
- Never say "as an AI" or break character.
- Never give medical diagnoses. If they mention self-harm, abuse, or being
  unsafe, respond with warmth and gently encourage reaching out to
  Tele-MANAS (14416) - but keep it natural, not a canned disclaimer.
`;

// NEW: relationship/social-skills coach mode - used by the Relationship
// Chat feature (replaced the old static tip list in what used to be
// SocialSkills.jsx). Same safety net, same Groq/Gemini fallback chain,
// just a different system prompt - reuses all the existing chatbot
// infrastructure instead of duplicating it.
const RELATIONSHIP_SYSTEM_PROMPT = `
You are Emovra AI, acting as a warm, honest relationship & social skills
coach. Someone is describing a real situation - a friendship, family
relationship, or romantic relationship - and wants to think it through.

Your job:
- Actually listen to the specifics of what they describe before responding
  - don't give generic advice that could apply to anyone.
- Gently point out real patterns worth noticing - unhealthy dynamics,
  one-sided effort, communication breakdowns, or their own part in a
  conflict - honestly, but kindly, never harshly or with blame.
- Offer one concrete, practical next step or way to think about it, not a
  lecture.
- Ask a genuine follow-up question when there's a natural one, to
  understand the situation better - not every reply needs one.

Rules:
- Keep replies short (3-5 sentences).
- Never say "as an AI" or break character.
- Never diagnose the other person in their story (e.g. "that sounds like
  narcissistic abuse") - describe the PATTERN you're noticing in plain,
  concrete terms instead of a clinical label.
- If what they describe sounds like actual abuse (physical violence,
  threats, controlling/isolating behavior), take that seriously and
  gently encourage them to reach out to Tele-MANAS (14416) or a trusted
  adult - don't just treat it as a normal relationship disagreement.
`;

// This route ALSO silently runs the same keyword-based risk check every
// other entry point in this app uses (see utils/localRiskFallback.js), and
// saves RED/ORANGE the same way analyze.js does. Without this, a chatbot
// conversation would be a blind spot where someone could disclose something
// serious and it would never reach the crisis-detection pipeline at all -
// that's not acceptable for this app, chatbot or not.
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { messages, mode } = req.body; // mode: undefined (default) | "relationship"
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages array required" });
    }
    const activePrompt = mode === "relationship" ? RELATIONSHIP_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userId = req.user?.id || req.body.userId || "anonymous";

    // 1. Safety net - runs on every message, regardless of what the
    // conversational reply below says.
    if (lastUserMsg?.text) {
      const risk = localRiskFallback(lastUserMsg.text);
      if (risk.risk === "RED" || risk.risk === "ORANGE") {
        await saveAnalysis({
          userId,
          text: lastUserMsg.text,
          risk: risk.risk,
          score: risk.score,
          category: risk.category,
          abuseType: risk.abuseType,
          abuseSource: risk.abuseSource,
          triggers: risk.triggers,
        });
      }
    }

    // 2. Conversational reply - Groq first (free, fast), Gemini as backup
    // if Groq fails or isn't configured, generic supportive line only if
    // both are unavailable.
    let reply = "I'm here. Tell me a bit more about what's going on?";
    const transcript = messages
      .slice(-10) // keep prompt small
      .map((m) => `${m.role === "user" ? "Person" : "Emovra"}: ${m.text}`)
      .join("\n");

    let gotReply = false;

    const groqReply = await chatWithGroq(activePrompt, `Conversation so far:\n${transcript}\n\nEmovra:`);
    if (groqReply) {
      reply = groqReply;
      gotReply = true;
    }

    // Gemini backup - only tried when Groq failed or GROQ_API_KEY isn't set.
    if (!gotReply && process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await callGeminiResilient(() => model.generateContent(`${activePrompt}\n\nConversation so far:\n${transcript}\n\nEmovra:`));
        reply = result.response.text().trim() || reply;
        gotReply = true;
      } catch (e) {
        console.error("Chatbot Gemini error:", e.message?.slice(0, 200));
      }
    }

    if (!gotReply) {
      reply = "I'm having a little trouble thinking right now, but I'm still here - go on, I'm listening.";
    }

    // 3. XP for a real conversation (awarded once, right as it crosses the
    // threshold - not every message).
    const userTurns = messages.filter((m) => m.role === "user").length;
    let gam = null;
    if (req.user?.id && userTurns === 3) {
      const today = todayIST();
      const user = await User.findById(req.user.id).select("lastChatbotXPDate");
      if (user && user.lastChatbotXPDate !== today) {
        gam = await awardXP(req.user.id, 10, { chatbotUsed: true });
        await User.findByIdAndUpdate(req.user.id, { lastChatbotXPDate: today });
      }
    }

    res.json({ success: true, reply, gamification: gam });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ success: false, message: "Chatbot failed", reply: "Sorry, I lost my train of thought - try again?" });
  }
});

export default router;
