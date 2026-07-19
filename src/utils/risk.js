import { detectAbuse } from './abuse.js';
import { detectEmotion } from './emotion.js';
import { analyzeSentiment } from './sentiment.js';
import { cleanText } from './cleanText.js'; // ✅ NEW LINE 4: ADD IMPORT

export function calculateRisk(text) {
  if (!text || !text.trim()) return null;
  const lower = cleanText(text); // ✅ NEW LINE 7: FIX GRAMMAR - "iam anxius" -> "i am anxious"
  if (lower.includes("dont want to die") || lower.includes("don't want to die") || lower.includes("do not want to die")) {
    return { riskLevel: "GREEN", score: 10, emotion: "hopeful", sentiment: "positive", reasons: ["affirms desire to live"], abuse: { isAbuse: false } };
  }
  const abuseResult = detectAbuse(lower); // ✅ CHANGED: use cleaned `lower`
  const emotion = detectEmotion(lower); // ✅ CHANGED: use cleaned `lower`
  const rawSent = analyzeSentiment(lower); // ✅ CHANGED: use cleaned `lower`
  const sentiment = typeof rawSent === 'string' ? rawSent : 'neutral';
  let score = 0; let riskLevel = "GREEN"; let reasons = [];
  if (lower.includes("want to die") || lower.includes("kill myself") || lower.includes("end my life")) {
    score = 95; riskLevel = "RED"; reasons = ["self-harm intent"];
  } else if (abuseResult && abuseResult.abuseDetected) {
    score = abuseResult.count >= 2 ? 70 : 40;
    riskLevel = score >= 70 ? "ORANGE" : "YELLOW";
    reasons = abuseResult.matches || [];
  } else {
    if (['sad','anxious','lonely','overwhelmed'].includes(emotion)) score += 45; // ✅ CHANGED 30 -> 45
    if (sentiment === 'negative') score += 20;
    if (lower.includes("anxious") || lower.includes("anxiety")) score += 15; // ✅ NEW: extra boost so anxious = 60 = ORANGE
    if (score >= 70) riskLevel = "RED"; else if (score >= 45) riskLevel = "ORANGE"; else if (score >= 25) riskLevel = "YELLOW"; // ✅ CHANGED 75/50 -> 70/45
    reasons = [emotion, sentiment];
  }
  return { riskLevel, score, emotion, sentiment, reasons, abuse: abuseResult };
}