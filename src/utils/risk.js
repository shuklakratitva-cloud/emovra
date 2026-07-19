export function calculateRisk(text, sentiment, emotion) {
  if (!text || !text.trim()) {
    return { level: 'NONE', color: 'GRAY', score: 0, label: 'Awaiting Input', message: 'Share how you feel to see analysis.', reasons: [], text: '' };
  }
  const lower = text.toLowerCase().trim();

  const red = ['suicide','kill myself','marna chahta','marna chahti','mar jana','end my life','self harm','self-harm','khud ko nuksan','want to die','marne ka man','better off dead','no reason to live','jaan de dunga','jaan de dungi'];
  if (red.some(k => lower.includes(k))) {
    return { level: 'HIGH', color: 'RED', score: 98, label: 'High Risk', message: 'Immediate support recommended. You are not alone - please reach out now to Tele-MANAS 14416 or a trusted person.', reasons: ['Critical keywords'], text };
  }

  const abuseHinglish = [
    'emotional abuse','gaslight','gaslighting','manipulat','narcissist','controls me','walking on eggshells','belittles me','humiliates me','threatens me','verbally abusive','toxic','abusive',
    'gaali deta hai','gaali deti hai','gali deta','gali deti','maarta hai','maarti hai','pitai karta','daant ta hai','dhamki deta','dhamkata hai','beizzati karta','izzat nahi karta','control karta hai','rokta hai','jaane nahi deta','baat nahi karne deta','akela kar diya','pagal bolta hai','paagal kehta','worthless bolta','nikammi bolta','nikamma','ghar se nikal dunga','jaan se maar dunga','marne ki dhamki','tana deta','taana deti',
    'ghutan ho rahi','ghutan ho raha','dar lag raha','ghabrahat','bechaini','rone ka man','akela feel'
  ];

  const yellowList = ['anxious','anxiety','overwhelm','overwhelmed','stressed','stress','worried','panic','restless','tired','exhausted','lonely','confused','irritated','nervous','sad','uneasy','tense','tension','thakan','thak gaya','thak gayi','neend nahi','pareshan','pareshaan','udasi','akela','akeli','dar','bechain'];
  const orangeList = ['hopeless','worthless','empty','numb','crying','cant sleep','cannot sleep','isolated','trapped','failure','hate myself','depressed','helpless','useless','rona aa raha','jeene ka man nahi','kuch acha nahi lagta','khatam ho gaya','sab khatam','andhera lag raha','khali khali'];

  let abuseCount = abuseHinglish.filter(k => lower.includes(k)).length;
  let y = yellowList.filter(k => lower.includes(k)).length;
  let o = orangeList.filter(k => lower.includes(k)).length;

  let score = y * 12 + o * 22 + abuseCount * 18;
  let reasons = [];
  if (y) reasons.push(`${y} stress indicators`);
  if (o) reasons.push(`${o} elevated indicators`);
  if (abuseCount) reasons.push(`${abuseCount} abuse/relationship indicators`);
  if (sentiment?.score < -0.3) score += 10;
  if (sentiment?.score < -0.6) score += 10;
  if (emotion?.dominant === 'fear' || emotion?.dominant === 'sadness' || emotion?.dominant === 'anger') { score += 8; reasons.push(`Emotion: ${emotion.dominant}`); }
  if (text.split(/\s+/).length > 50 && score < 22) score += 6;

  if (abuseCount > 0) return { level: 'MEDIUM_HIGH', color: 'ORANGE', score: Math.max(65, score), label: 'Elevated Concern - Abuse/Toxic Stress Detected', message: 'What you describe sounds like emotional/verbal abuse or toxic stress. This is not your fault. Consider speaking to a counselor or calling 14416.', reasons, text };
  if (score >= 75) return { level: 'HIGH', color: 'RED', score, label: 'High Risk', reasons, text, message: 'Please seek immediate support from a professional or helpline.' };
  if (score >= 48) return { level: 'MEDIUM_HIGH', color: 'ORANGE', score, reasons, text, label: 'Elevated Concern', message: 'You seem to be carrying heavy feelings. Talking to someone you trust may help.' };
  if (score >= 18) return { level: 'MEDIUM', color: 'YELLOW', score, reasons, text, label: 'Moderate Stress', message: 'It sounds like you are carrying a lot right now. Grounding exercises and a short walk may help.' };
  if (score >= 7) return { level: 'LOW_MED', color: 'LIGHT_GREEN', score, reasons, text, label: 'Mild Stress', message: 'Some early stress signals. Keep checking in with yourself.' };
  return { level: 'LOW', color: 'GREEN', score, reasons: ['No major risk detected'], text, label: 'Doing Okay', message: 'Positive signals. Continue self-care and check-ins.' };
}
export default calculateRisk;