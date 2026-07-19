export function analyzeSentiment(text) {
  if (!text || !text.trim()) {
    return { score: 0, label: 'Neutral', rawScore: 0 };
  }
  const lower = text.toLowerCase();
  const positive = ['happy','good','great','love','joy','calm','peace','hope','better','fine','okay','well','excited','grateful','content','relaxed','proud','confident'];
  const negative = ['sad','bad','angry','hate','anxious','anxiety','stressed','depressed','lonely','tired','worried','fear','panic','overwhelmed','upset','hurt','cry','crying','exhausted','irritated','frustrated','nervous','restless','down','low','empty','hopeless','worthless'];
  let score = 0;
  positive.forEach(w => { if (lower.includes(w)) score += 1; });
  negative.forEach(w => { if (lower.includes(w)) score -= 1; });
  const normalized = Math.max(-1, Math.min(1, score / 5));
  let label = 'Neutral';
  if (normalized > 0.25) label = 'Positive';
  else if (normalized < -0.25) label = 'Negative';
  return { score: normalized, label, rawScore: score };
}
export default analyzeSentiment;