// src/utils/risk.js
export function calculateRisk(text, sentiment, emotion) {
  if (!text) {
    return { level: 'LOW', color: 'GREEN', label: 'Doing Okay', score: 0, message: 'Share how you feel to get support.', reasons: [] };
  }

  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // CRITICAL - Always RED
  const redKeywords = ['suicide','kill myself','end my life','self harm','self-harm','want to die','no reason to live','better off dead'];
  if (redKeywords.some(k => lower.includes(k))) {
    return {
      level: 'HIGH',
      color: 'RED',
      label: 'High Risk',
      score: 95,
      message: 'Immediate support recommended. You are not alone - please reach out now to Tele-MANAS 14416 or a trusted person.',
      reasons: ['Critical keywords detected']
    };
  }

  const yellowKeywords = ['anxious','anxiety','overwhelm','overwhelmed','stressed','stress','worried','panic','restless','tired','exhausted','lonely','confused','irritated','angry','sad','nervous'];
  const orangeKeywords = ['hopeless','worthless','empty','numb','crying','cant sleep','cannot sleep','can\'t sleep','isolated','trapped','failure','hate myself','depressed'];

  let yellowCount = yellowKeywords.filter(k => lower.includes(k)).length;
  let orangeCount = orangeKeywords.filter(k => lower.includes(k)).length;

  let score = 0;
  let reasons = [];

  score += yellowCount * 12;
  score += orangeCount * 22;

  if (yellowCount > 0) reasons.push(`${yellowCount} stress indicators`);
  if (orangeCount > 0) reasons.push(`${orangeCount} elevated indicators`);

  if (sentiment) {
    if (sentiment.score < -0.3) score += 12;
    if (sentiment.score < -0.6) score += 12;
  }
  if (emotion && (emotion.dominant === 'sadness' || emotion.dominant === 'fear')) {
    score += 8;
    reasons.push(`Emotion: ${emotion.dominant}`);
  }

  // long para bonus - don't penalize heavily
  if (wordCount > 60 && score < 25) score += 5;

  // THRESHOLDS - This makes YELLOW appear
  if (score >= 75) {
    return { level: 'HIGH', color: 'RED', label: 'High Risk', score, reasons, message: 'Please seek immediate support from a professional or helpline.' };
  }
  if (score >= 50) {
    return { level: 'MEDIUM_HIGH', color: 'ORANGE', label: 'Elevated Concern', score, reasons, message: 'Consider talking to someone you trust. Breathing exercises may help.' };
  }
  if (score >= 22) { // <-- YELLOW STARTS HERE
    return { level: 'MEDIUM', color: 'YELLOW', label: 'Moderate Stress', score, reasons, message: 'It sounds like you are carrying a lot right now. Grounding exercises and a short walk may help.' };
  }

  return { level: 'LOW', color: 'GREEN', label: 'Doing Okay', score, reasons: ['No major risk detected'], message: 'Glad to see some positive signals. Keep checking in with yourself!' };
}

export default calculateRisk;