// src/utils/analyzeRisk.js - FINAL BUILD-SAFE - meets all demands
export function analyzeRisk(text) {
  if (!text || !text.trim()) return null;
  const t = String(text).toLowerCase();
  let score = 0;
  let reasons = [];
  let level = "GREEN";

  // 1. DIRECT - instant RED like "i want to die"
  const direct = ["kill myself","kys","want to die","end my life","take my own life","suicide","suicidal","hang myself","overdose","cut myself","slit my wrist"];
  for (let p of direct) {
    if (t.includes(p)) { score += 100; reasons.push(p); level = "RED"; }
  }

  // 2. YOUR BUG FIX - indirect passive must be RED not GREEN
  const indirect = [
    "if i disappeared","if i disappear","no one would notice","no one would care","no one cares",
    "better off without me","everyone better off","dont know what to do","do not know what to do",
    "what is the point","whats the point","no point in living","tired of living","tired of life",
    "wish i was dead","wish i was gone","wish i wasnt here","cant go on","cannot go on",
    "give up on life","no reason to live","life is pointless","worthless","i am a burden","burden to everyone",
    "nobody needs me","nobody wants me","want to disappear","disappear forever","if i was gone"
  ];
  let indirectHits = 0;
  for (let p of indirect) {
    if (t.includes(p)) { indirectHits++; score += 45; reasons.push(p); }
  }

  // Combo logic for your exact sentence: dont know what to do + disappeared + no one would notice
  if (indirectHits >= 1) {
    if (t.includes("disappear") && (t.includes("no one") || t.includes("nobody") || t.includes("notice") || t.includes("care") || t.includes("gone"))) {
      score += 60; level = "RED"; reasons.push("disappearance + social invisibility");
    }
    if (indirectHits >= 2) { score += 30; level = "RED"; }
    else if (indirectHits === 1 && score < 80) { score += 20; if(level==="GREEN") level="ORANGE"; }
  }

  // 3. Long para support
  const orangeWords = ["hopeless","helpless","trapped","alone","lonely","isolated","empty","numb","overwhelmed","breaking down","falling apart","hate myself","self hate"];
  const yellowWords = ["anxious","anxiety","stressed","sad","depressed","depression","tired","exhausted","worried","overthinking","panic","low","down"];

  for (let w of orangeWords) if (t.includes(w)) { score += 18; reasons.push(w); if(level==="GREEN") level="ORANGE"; else if(level==="YELLOW") level="ORANGE"; }
  for (let w of yellowWords) if (t.includes(w)) { score += 8; reasons.push(w); if(level==="GREEN") level="YELLOW"; }

  // 4. Final scoring
  if (score >= 75) level = "RED";
  else if (score >= 40) level = "ORANGE";
  else if (score >= 15) level = "YELLOW";
  else level = "GREEN";

  // 5. Emotion and advice logic - fewer devices when RED (your demand)
  let emotion = "neutral";
  if (t.includes("sad") || t.includes("lonely") || t.includes("disappear") || t.includes("notice") || t.includes("alone")) emotion = "sad";
  else if (t.includes("anxious") || t.includes("worried") || t.includes("panic")) emotion = "anxious";
  else if (t.includes("angry") || t.includes("hate")) emotion = "angry";
  else if (t.includes("hopeless") || t.includes("worthless") || t.includes("burden")) emotion = "hopeless";
  else if (t.includes("stressed") || t.includes("overwhelmed")) emotion = "stressed";
  else if (level==="GREEN") emotion = "calm";

  const isCrisis = level === "RED";
  const helpline = isCrisis ? "Tele-MANAS: 14416 | Kiran: 1800-599-0019" : null;
  const advice = isCrisis
    ? "Crisis pattern detected. You matter. Please talk to someone now. Call 14416. Stay with someone you trust. Fewer suggestions for safety."
    : level === "ORANGE" ? "Stress detected. Try 4-7-8 breathing, grounding, walk."
    : level === "YELLOW" ? "Mild tension. Pause and stretch."
    : "Stable. Keep healthy routine.";

  return {
    riskLevel: level,
    level: level,
    score: Math.min(score, 100),
    emotion: emotion,
    sentiment: score > 35 ? "negative" : score < 15 ? "positive" : "neutral",
    reasons: [...new Set(reasons)].slice(0,7),
    isCrisis: isCrisis,
    helpline: helpline,
    advice: advice,
    timestamp: new Date().toISOString()
  };
}