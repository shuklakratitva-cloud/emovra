// src/utils/counselor.js - MULTI-EMOTION version
import { counselingKB } from "../data/counselingKB.js";

// NEW: resolves an entry's technique/advice to the requested language,
// falling back to the English field if a *_hi field isn't set - keeps the
// caller (MindGuardApp.jsx) simple, it just reads .technique/.advice like
// before and always gets the right language back.
function resolveLang(entry, lang) {
  if (lang !== "hi") return entry;
  return {
    ...entry,
    technique: entry.technique_hi || entry.technique,
    advice: entry.advice_hi || entry.advice,
  };
}

export function getCounselingAdvice(userText, dominantEmotion, riskLevel, lang = "en") {
  if (!userText) return [];
  const lower = userText.toLowerCase();

  // Score every technique
  const scored = counselingKB.map(entry => {
    let score = 0;
    let matchedKeywords = [];
    entry.keywords.forEach(k => {
      if (lower.includes(k)) {
        score += 10;
        matchedKeywords.push(k);
      }
    });
    if (entry.emotion === dominantEmotion) score += 5;
    return {...entry, score, matchedKeywords };
  }).filter(e => e.score > 0);

  // Sort high to low, take top 3 unique emotions
  scored.sort((a,b) => b.score - a.score);

  const unique = [];
  const seenEmotion = new Set();
  for (let item of scored) {
    if (!seenEmotion.has(item.emotion)) {
      seenEmotion.add(item.emotion);
      unique.push(item);
    }
    if (unique.length >= 3) break;
  }

  // If nothing matched, return stressed as fallback
  if (unique.length === 0) {
    const fallback = counselingKB.find(e => e.emotion === "stressed") || counselingKB[0];
    return [resolveLang(fallback, lang)];
  }

  // Add RED disclaimer if needed
  if (riskLevel === "RED") {
    return unique.map(u => ({
      ...resolveLang(u, lang),
      disclaimer: lang === "hi"
        ? "आपको तुरंत सहायता की आवश्यकता है। 14416 पर कॉल करें। यह केवल शैक्षिक जानकारी है, चिकित्सीय निदान नहीं।"
        : "You deserve immediate support. Call 14416. This is educational only, not medical diagnosis.",
    }));
  }

  return unique.map(u => resolveLang(u, lang));
}

// For backward compatibility
export function getTopEmotions(userText) {
  const lower = (userText||"").toLowerCase();
  const counts = {};
  counselingKB.forEach(entry => {
    entry.keywords.forEach(k => {
      if (lower.includes(k)) {
        counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
      }
    });
  });
  const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
  return Object.entries(counts)
   .map(([emotion, count]) => ({ emotion, percent: Math.round((count/total)*100) }))
   .sort((a,b)=>b.percent-a.percent)
   .slice(0,3);
}
