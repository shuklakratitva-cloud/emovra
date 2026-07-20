// src/utils/counselor.js
import { counselingKB } from "../data/counselingKB.js";

export function getCounselingAdvice(userText, emotion, riskLevel) {
  if (!userText) return null;
  const lower = userText.toLowerCase();

  // Score each KB entry by keyword match
  let best = null;
  let bestScore = 0;

  counselingKB.forEach(entry => {
    let score = 0;
    entry.keywords.forEach(k => {
      if (lower.includes(k)) score += 10;
    });
    if (entry.emotion === emotion) score += 15;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });

  // If no match, give general
  if (!best) {
    best = counselingKB.find(e => e.emotion === "stressed") || counselingKB[0];
  }

  // Safety: If RED risk, always add helpline, don't replace with advice
  if (riskLevel === "RED") {
    return {
      ...best,
      disclaimer: "You deserve immediate support. This technique is not a replacement for professional help. Please call 14416 now."
    };
  }

  return best;
}