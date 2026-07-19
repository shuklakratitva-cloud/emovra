export function detectEmotion(text) {
  if (!text ||!text.trim()) {
    return { dominant: 'neutral', scores: {}, label: 'Neutral' };
  }
  const lower = text.toLowerCase();
  const emotions = {
    joy: ['happy','joy','excited','love','great','wonderful','grateful','proud','content'],
    sadness: ['sad','down','low','depressed','lonely','cry','crying','empty','hopeless','tearful'],
    anger: ['angry','mad','irritated','frustrated','annoyed','furious','hate'],
    fear: ['anxious','anxiety','scared','afraid','worried','panic','nervous','fear','restless','overwhelm','overwhelmed','stressed'],
    calm: ['calm','peace','relaxed','fine','okay','well','balanced','serene']
  };
  let scores = {};
  let maxScore = 0;
  let dominant = 'neutral';
  for (let emo in emotions) {
    scores[emo] = 0;
    emotions[emo].forEach(word => {
      if (lower.includes(word)) scores[emo] += 1;
    });
    if (scores[emo] > maxScore) {
      maxScore = scores[emo];
      dominant = emo;
    }
  }
  return { dominant, scores, label: dominant.charAt(0).toUpperCase() + dominant.slice(1) };
}
export default detectEmotion;