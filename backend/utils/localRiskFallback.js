const RED_PHRASES = [
  "mujhe marna hai", "i want to die", "i want to end my life", "kill myself",
  "end my life", "mar jaunga", "mar jaungi", "khudkushi karunga",
  "suicide", "want to end it all", "no reason to live", "better off dead",

  "நான் செத்துவிட வேண்டும்", "எனக்கு சாக வேண்டும்", "నేను చావాలి",
  "আমি মরে যেতে চাই", "मला मरायचे आहे", "મારે મરવું છે",
  "ನಾನು ಸಾಯಬೇಕು", "എനിക്ക് മരിക്കണം", "ਮੈਂ ਮਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ", "میں مرنا چاہتا ہوں",
];

const SCHOOL_ABUSE = /\b(teacher|sir|ma'?am|madam)\b[^.!?\n]{0,40}\b(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|insult(ed)?|beizzati|daant(a|i)?|target(s|ed)?|shout(s|ed|ing)?|compar(es|ed|ing)|makes? fun)\b|\b(sabke samne|class me|publicly)\b[^.!?\n]{0,40}\b(daant|beizzati|insult|shame|humiliat)/i;

const HOME_ABUSE = /(beats me|hits me|maarta hai|maarti hai|pitta hai|gaali deta|gaali deti|abuse karta|toxic relationship|gaslighting|worthless bolta|kutta jaise|blackmail karta|slaps me)/i;

// Narrow, same-topic signal that a "hits me" style message may be describing
// a two-sided/mutual incident (e.g. a sibling fight) rather than one-sided
// abuse - e.g. "he hit me" followed (in the same message, or the previous
// message when a caller passes conversation context) by "because I hit him
// first". This does NOT downgrade self-harm (RED) detection - that stays
// instant regardless, per the safety-always-overrides-tone rule. It only
// softens the ORANGE home-abuse classification so a single early fragment
// isn't logged as confident one-sided abuse before the rest of the story is
// in. Deliberately narrow (self-defense/two-sided framing only) - it must
// NOT match generic minimization ("it's not a big deal", "I'm fine"),
// because minimizing language is itself sometimes a sign of real abuse, not
// evidence against it.
export const MUTUAL_CONTEXT =
  /\b(i|main|maine)\s+(hit|pushed|slapped|punched|maara|mara)\w*\s*(him|her|them|use|usko)?\s*(first|pehle)\b|\bi started it\b|\b(hit|pushed|slapped|punched)\s*(him|her|them)?\s*back\b|\bwe\s+(were\s+)?(both\s+)?(hit|hitting|pushed|pushing|fighting)(\s+each other)?\b|\bboth of us\b|\bit was mutual\b|\bwe were both\b/i;

export function hasMutualContext(text, priorText = "") {
  const combined = `${priorText || ""} ${text || ""}`.toLowerCase();
  return MUTUAL_CONTEXT.test(combined);
}

const ORANGE_WORDS = [
  "anxious", "anxiety", "panic", "lonely", "akela", "depressed", "depression",
  "stress", "overwhelm", "neend nahi", "nervous", "scared", "worried",
  "tension", "bechain", "breakup", "kharab hai",
];

const YELLOW_WORDS = [
  "tired", "thak gaya", "thak gayi", "off today", "not myself", "meh",
  "bored", "boring day", "kinda down", "little down", "so-so", "okay-ish",
  "bas aisa hi", "thoda low", "not sure why", "low", "upset", "sad",
];

export function localRiskFallback(rawText, priorText = "") {
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
    const mutual = hasMutualContext(text, priorText);
    return {
      risk: "ORANGE",
      score: mutual ? 45 : 75,
      reason: mutual
        ? "Local fallback - hit/abuse phrase, but message (or the message before it) also frames it as two-sided/self-defense - flagged for human review, not treated as confirmed one-sided abuse (AI unavailable)"
        : "Local fallback - home emotional abuse pattern (AI unavailable)",
      triggers: mutual ? ["possible_mutual_conflict"] : ["emotional_abuse", "gaslighting"],
      category: "emotional_abuse", abuseType: "home_abuse", abuseSource: "parent",
      ambiguous: mutual,
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
