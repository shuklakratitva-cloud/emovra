const API = "https://emovra.onrender.com/api";
export async function analyzeWithGemini(text, toneData = null) {
  const lower = text.toLowerCase().trim();
  const violence = ["kill","murder","stab","shoot","hurt him","hurt her","kill him","kill her","want to kill","gonna kill","i will kill","choke","beat him","slit"];
  const abuseList = [
    "fuck","fucking","motherfucker","mf","bitch","bastard","asshole","madarchod","behenchod","bhenchod","chutiya","gandu","lodu","harami","kamine","kutta","kutte","randi","saala","saali","mc","bc","lavde","bsdk","bhadwa","chud","gaand","gand","chut","lund"
  ];
  if (violence.some(k => lower.includes(k))) {
    return {
      level: "RED", riskLevel: "RED", score: 98,
      emotion: "angry", sentiment: "negative",
      reasons: ["violence / homicidal intent detected"],
      advice: "Intense anger detected. Stop. Breathe. Do not act. Step away and talk to someone now.",
      isCrisis: true,
      helpline: "Tele-MANAS 14416 | If you may act, call 112",
      source: "force-RED-violence"
    };
  }
   const foundAbuse = abuseList.filter(w => lower.includes(w));
  if (foundAbuse.length > 0) {
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, toneData })
      });
      const data = await res.json();
      let forcedScore = foundAbuse.length >= 3 ? 65 : foundAbuse.length >=2 ? 50 : 35;
      if (lower === lower.toUpperCase() && lower.length > 5) forcedScore += 10;
      const finalScore = Math.max(data.score || 0, forcedScore);
      let finalLevel = data.riskLevel || data.level || "ORANGE";
      if (finalScore >= 70) finalLevel = "RED";
      else if (finalScore >= 45) finalLevel = "ORANGE";
      else finalLevel = "ORANGE";
      return {
        level: finalLevel, riskLevel: finalLevel,
        score: finalScore,
        emotion: data.emotion || "angry",
        sentiment: "negative",
        reasons: [`abusive language detected: ${foundAbuse.slice(0,3).join(", ")}`, ...(data.reasons||[])],
        advice: data.reply || "Abuse shows high stress/anger. Try pausing, breathing 4-4-4-4, and rephrasing your feelings without slurs.",
        isCrisis: finalLevel === "RED",
        source: "abuse-forced-" + forcedScore
      };
    } catch {
      const score = foundAbuse.length >=2 ? 55 : 35;
      return {
        level: score >=45 ? "ORANGE" : "ORANGE", riskLevel: score >=45 ? "ORANGE" : "ORANGE",
        score: score, emotion: "angry", sentiment: "negative",
        reasons: [`abusive language: ${foundAbuse.join(", ")}`],
        advice: "High anger/abuse detected. Take a break, breathe, avoid acting while angry.",
        isCrisis: false, source: "client-abuse-force"
      };
    }
  }
   try {
    const res = await fetch(`${API}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, toneData })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      level: data.riskLevel, riskLevel: data.riskLevel,
      score: data.score,
      emotion: data.emotion,
      sentiment: data.riskLevel === "RED" || data.riskLevel === "ORANGE" ? "negative" : "neutral",
      reasons: data.triggers || [],
      advice: data.reply,
      isCrisis: data.riskLevel === "RED",
      helpline: data.riskLevel === "RED" ? "Tele-MANAS: 14416 | Kiran: 1800-599-0019" : null,
      source: "gemini-chat",
    };
  } catch (e) {
    return {
      level: "ORANGE", riskLevel: "ORANGE", score: 30,
      emotion: "neutral", sentiment: "neutral",
      reasons: ["fallback"],
      advice: "Could not connect to AI, but noted.",
      isCrisis: false, source: "fallback"
    };
  }
}
