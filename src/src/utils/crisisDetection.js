const passivePatterns = [
  /better off without me/i,
  /want to disappear/i,
  /tired of being alive/i,
  /can't do this anymore/i,
  /no point anymore/i,
  /wish i wasn't here/i,
  /being a burden/i,
  /sleep forever/i,
  /no reason to live/i
];

const directPatterns = [
  /kill myself/i,
  /end my life/i,
  /commit suicide/i,
  /want to die/i
];

export function checkCrisis(text) {
  if (!text) return { level: 'none' };
  if (directPatterns.some(p => p.test(text))) return { level: 'high' };
  if (passivePatterns.some(p => p.test(text))) return { level: 'medium' };
  return { level: 'none' };
}