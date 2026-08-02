// utils/localRiskFallback.js
// Used ONLY when Gemini is unavailable (quota exceeded, network error, etc).
// The old behavior in analyze.js was to hard-code { risk: "GREEN", score: 20 }
// whenever Gemini threw ANY error - meaning a real quota outage (see your
// Render logs: "429 Too Many Requests") silently made every message look
// safe. This gives a real best-effort classification instead of a fake-safe
// default, so a genuine crisis message doesn't get swallowed just because
// the AI call failed.
//
// This intentionally mirrors the logic already in analyze.js's keyword
// safety-nets and the frontend's analyzeRisk.js, so behavior stays close to
// what you already tuned - it's a safety net for a safety net, not a
// separate opinion.

const RED_PHRASES = [
  "mujhe marna hai", "i want to die", "i want to end my life", "kill myself",
  "end my life", "mar jaunga", "mar jaungi", "khudkushi karunga",
  "suicide", "want to end it all", "no reason to live", "better off dead",
];

const SCHOOL_ABUSE = /\b(teacher|sir|ma'?am|madam)\b[^.!?\n]{0,40}\b(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|insult(ed)?|beizzati|daant(a|i)?|target(s|ed)?|shout(s|ed|ing)?|compar(es|ed|ing)|makes? fun)\b|\b(sabke samne|class me|publicly)\b[^.!?\n]{0,40}\b(daant|beizzati|insult|shame|humiliat)/i;

const HOME_ABUSE = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|toxic relationship|gaslighting|worthless bolta|kutta jaise|blackmail karta|slaps me)/i;

const ORANGE_WORDS = [
  "anxious", "anxiety", "panic", "lonely", "akela", "depressed", "depression",
  "stress", "overwhelm", "neend nahi", "nervous", "scared", "worried",
  "tension", "bechain", "breakup", "kharab hai",
];

// NEW: this classifier never had a YELLOW band at all - only GREEN/ORANGE/
// RED - meaning even when Gemini and Groq were both down, the local
// fallback could never produce YELLOW either. Mild, vague words that
// don't rise to the ORANGE_WORDS level above.
const YELLOW_WORDS = [
  "tired", "thak gaya", "thak gayi", "off today", "not myself", "meh",
  "bored", "boring day", "kinda down", "little down", "so-so", "okay-ish",
  "bas aisa hi", "thoda low", "not sure why", "low", "upset", "sad",
];

export function localRiskFallback(rawText) {
  const text = String(rawText || "");
  const lower = text.toLowerCase();

  const isRed = RED_PHRASES.some((p) => lower.includes(p));
  if (isRed) {
    const isSchool = SCHOOL_ABUSE.test(lower);
    const isHome = HOME_ABUSE.test(lower);
    return {
      risk: "RED",
      score: 95,
      reason: "Local fallback - direct crisis phrase (AI unavailable)",
      triggers: isSchool ? ["self-harm", "teacher_remark"] : isHome ? ["self-harm", "emotional_abuse"] : ["self-harm"],
      category: isSchool ? "school_emotional_abuse" : isHome ? "emotional_abuse" : "self_harm",
      abuseType: isSchool ? "school_emotional_abuse" : isHome ? "home_abuse" : "none",
      abuseSource: isSchool ? "teacher" : isHome ? "parent" : "none",
      isAI: false,
      isFallback: true,
    };
  }

  if (SCHOOL_ABUSE.test(lower)) {
    return {
      risk: "ORANGE", score: 85,
      reason: "Local fallback - school emotional abuse pattern (AI unavailable)",
      triggers: ["teacher_remark", "public_shaming"],
      category: "school_emotional_abuse", abuseType: "school_emotional_abuse", abuseSource: "teacher",
      isAI: false, isFallback: true,
    };
  }

  if (HOME_ABUSE.test(lower)) {
    return {
      risk: "ORANGE", score: 75,
      reason: "Local fallback - home emotional abuse pattern (AI unavailable)",
      triggers: ["emotional_abuse", "gaslighting"],
      category: "emotional_abuse", abuseType: "home_abuse", abuseSource: "parent",
      isAI: false, isFallback: true,
    };
  }

  const hits = ORANGE_WORDS.filter((w) => lower.includes(w));
  if (hits.length > 0) {
    return {
      risk: "ORANGE", score: 60 + Math.min(hits.length * 5, 20),
      reason: "Local fallback - distress keywords (AI unavailable)",
      triggers: ["anxiety", "distress"],
      category: "general", abuseType: "none", abuseSource: "none",
      isAI: false, isFallback: true,
    };
  }

  const yellowHits = YELLOW_WORDS.filter((w) => lower.includes(w));
  if (yellowHits.length > 0) {
    return {
      risk: "YELLOW", score: 30 + Math.min(yellowHits.length * 5, 15),
      reason: "Local fallback - mild/vague unease (AI unavailable)",
      triggers: ["mild_unease"],
      category: "general", abuseType: "none", abuseSource: "none",
      isAI: false, isFallback: true,
    };
  }

  return {
    risk: "GREEN", score: 15,
    reason: "Local fallback - no risk markers found (AI unavailable)",
    triggers: ["general"], category: "general", abuseType: "none", abuseSource: "none",
    isAI: false, isFallback: true,
  };
}
