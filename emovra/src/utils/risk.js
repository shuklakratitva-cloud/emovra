
import { SUICIDE_PHRASES, VIOLENCE_PHRASES, SAFE_NEGATIONS, RISK_LEVELS } from "../data/keywords";
import { normalizeText, containsPhrase } from "./helpers";
import { detectEmotion } from "./emotion";
import { detectSentiment } from "./sentiment";
import { detectAbuse } from "./abuse";

// FIXED: Safe check must run FIRST and must match "i dont want to die"
function isSafe(text){
  const n = normalizeText(text); // "i dont want to die"
  if(!n) return false;
  // direct includes is more reliable than padded includes for this case
  for(const p of SAFE_NEGATIONS){
    const pn = normalizeText(p);
    if(n.includes(pn)) return true;
  }
  // extra hard-coded safety for common variants
  if(n.includes("dont want to die") || n.includes("do not want to die") || n.includes("dont wanna die") || n.includes("do not wanna die") || n.includes("never want to die") || n.includes("dont want to end my life") || n.includes("dont want to kill myself")) return true;
  return false;
}

export function calculateRisk(text){
  const t=(text||"").trim();
  if(!t || t.length<2) return {riskDetected:false,riskLevel:RISK_LEVELS.GREEN,score:0,emotion:"neutral",sentiment:"neutral",abuseDetected:false,suicideDetected:false,violenceDetected:false,timestamp:Date.now(),reasons:[]};

  // 1. SAFE CHECK FIRST - highest priority
  if(isSafe(t)){
    const emo = detectEmotion(t);
    const sent = detectSentiment(t);
    return {
      riskDetected:false,
      riskLevel:RISK_LEVELS.GREEN,
      score:0,
      emotion: emo.emotion,
      sentiment: sent.sentiment,
      abuseDetected:false,
      suicideDetected:false,
      violenceDetected:false,
      timestamp:Date.now(),
      reasons:["safe: explicitly says wants to live"]
    };
  }

  // 2. Only then check risky phrases
  const suicideDetected = containsPhrase(t, SUICIDE_PHRASES);
  const violenceDetected = containsPhrase(t, VIOLENCE_PHRASES);
  const abuse = detectAbuse(t);
  const emo = detectEmotion(t);
  const sent = detectSentiment(t);

  const reasons=[];
  if(suicideDetected) reasons.push("suicidal language");
  if(violenceDetected) reasons.push("violence/homicidal language");
  if(abuse.abuseDetected) reasons.push("abuse:"+abuse.severity);
  reasons.push("emotion:"+emo.emotion);
  reasons.push("sentiment:"+sent.sentiment);

  if(suicideDetected){
    return {riskDetected:true,riskLevel:RISK_LEVELS.RED,score:100,emotion:emo.emotion,sentiment:sent.sentiment,abuseDetected:abuse.abuseDetected,suicideDetected:true,violenceDetected:false,timestamp:Date.now(),reasons};
  }
  if(violenceDetected){
    return {riskDetected:true,riskLevel:RISK_LEVELS.RED,score:95,emotion:"angry",sentiment:"negative",abuseDetected:abuse.abuseDetected,suicideDetected:false,violenceDetected:true,timestamp:Date.now(),reasons};
  }

  let score=0;
  if(abuse.abuseDetected){ const m={high:35,medium:25,low:15}; score+=m[abuse.severity]||0; }
  const em={happy:-15,sad:20,lonely:20,angry:18,fear:18,anxious:18,hopeless:30,overwhelmed:22,neutral:0};
  score+=em[emo.emotion]||0;
  if(sent.sentiment==="negative") score+=18;
  if(sent.sentiment==="positive") score-=12;
  if(emo.emotion!=="neutral" && sent.sentiment==="negative") score+=8;
  if(abuse.abuseDetected && sent.sentiment==="negative") score+=10;
  score=Math.max(0,Math.min(score,100));
  let lvl=RISK_LEVELS.GREEN;
  if(score>=70) lvl=RISK_LEVELS.RED;
  else if(score>=40) lvl=RISK_LEVELS.ORANGE;
  else if(score>=15) lvl=RISK_LEVELS.YELLOW;
  return {riskDetected:score>=15,riskLevel:lvl,score,emotion:emo.emotion,sentiment:sent.sentiment,abuseDetected:abuse.abuseDetected,suicideDetected:false,violenceDetected:false,timestamp:Date.now(),reasons};
}

export function getRiskColor(l){switch(l){case"GREEN":return"#22c55e";case"YELLOW":return"#eab308";case"ORANGE":return"#f97316";case"RED":return"#dc2626";default:return"#6b7280"}}
export function getRiskEmoji(l){switch(l){case"GREEN":return"🟢";case"YELLOW":return"🟡";case"ORANGE":return"🟠";case"RED":return"🔴";default:return"⚪"}}
export function getRiskMessage(l){switch(l){case"GREEN":return"No concerning language. Keep going!";case"YELLOW":return"Mild stress detected - take a moment to check in with yourself.";case"ORANGE":return"Moderate distress detected - consider talking to someone you trust.";case"RED":return"High risk language detected - please seek help or talk to someone immediately.";default:return""}}
export function getAdvice(level,emotion,sentiment){
  if(level==="GREEN"){ if(emotion==="happy"||sentiment==="positive") return "Great to hear you are positive! Keep gratitude journaling and share joy."; return "You're in a stable range. Maintain healthy habits: sleep, water, movement, and staying connected.";}
  if(level==="YELLOW"){ if(emotion==="anxious"||emotion==="overwhelmed") return "Try Box Breathing 4-4-4-4 for 2 mins or 5-4-3-2-1 grounding. A short walk can also help."; if(emotion==="sad"||emotion==="lonely") return "Consider reaching out to one person today, even with a short message. Write down one small thing you can do for yourself."; return "Mild stress is normal. Pause, hydrate, stretch, and write down 3 things that are within your control right now."; }
  if(level==="ORANGE") return "You are carrying a lot right now. Please talk to a trusted friend, family member, or counselor. Try a grounding exercise and avoid isolating yourself. Your feelings are valid and help is available.";
  return "You are showing high-risk language. If you have thoughts of harming yourself or others, please call Tele-MANAS 14416 or 1800-891-4416 immediately. Talk to a trusted adult or professional right away. You don't have to face this alone.";
}
