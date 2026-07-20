// src/utils/analyzeRisk.js
import { NEGATIVE_WORDS, POSITIVE_WORDS, SUICIDE_PHRASES, SAFE_NEGATIONS } from "../data/keywords.js";

export function analyzeRisk(text) {
  if (!text) return { riskLevel: "GREEN", emotion: "neutral", sentiment: "neutral", score: 0, reasons: ["No text"] };

  const lower = text.toLowerCase();

  // Check safe negation first
  if (SAFE_NEGATIONS.some(p => lower.includes(p))) {
    return { riskLevel: "GREEN", emotion: "safe", sentiment: "positive", score: 5, reasons: ["Reassuring language detected"] };
  }

  let score = 0;
  let reasons = [];

  // Suicide = instant RED
  if (SUICIDE_PHRASES.some(p => lower.includes(p))) {
    return { riskLevel: "RED", emotion: "hopeless", sentiment: "very negative", score: 95, reasons: ["Direct self-harm language detected"] };
  }

  NEGATIVE_WORDS.high.forEach(w => { if (lower.includes(w)) { score += 30; reasons.push(w); } });
  NEGATIVE_WORDS.medium.forEach(w => { if (lower.includes(w)) { score += 15; reasons.push(w); } });
  NEGATIVE_WORDS.low.forEach(w => { if (lower.includes(w)) { score += 8; reasons.push(w); } }); // <-- slight stress = 8 points

  // Positive reduces a bit
  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) score -= 5; });

  score = Math.max(0, Math.min(100, score));

  let riskLevel = "GREEN";
  let sentiment = "neutral";
  if (score === 0) { riskLevel = "GREEN"; sentiment = "calm"; }
  else if (score <= 20) { riskLevel = "YELLOW"; sentiment = "slight stress"; } // <-- This was always GREEN before, now YELLOW
  else if (score <= 50) { riskLevel = "ORANGE"; sentiment = "moderate stress"; }
  else { riskLevel = "RED"; sentiment = "high stress"; }

  // Determine emotion
  let emotion = "neutral";
  if (lower.includes("anxious") || lower.includes("worry") || lower.includes("panic")) emotion = "anxious";
  else if (lower.includes("sad") || lower.includes("cry") || lower.includes("lonely")) emotion = "sad";
  else if (lower.includes("angry") || lower.includes("irritated")) emotion = "angry";
  else if (reasons.length > 0) emotion = reasons[0];

  return { riskLevel, emotion, sentiment, score, reasons: reasons.length? [...new Set(reasons)] : ["mild tension"] };
}