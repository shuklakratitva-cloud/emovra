export async function analyzeWithGemini(text, toneData = null) {
  const lower = text.toLowerCase().trim();
  
  const violence = ["kill","murder","stab","shoot","hurt him","hurt her","kill him","kill her","want to kill","gonna kill","i will kill","choke","beat him","slit"];
  const abuseList = [
    "fuck","fucking","motherfucker","mf","bitch","bastard","asshole","madarchod","behenchod","bhenchod","chutiya","gandu","lodu","harami","kamine","kutta","kutte","randi","saala","saali","mc","bc","lavde","bsdk","bhadwa","chud","gaand","gand","chut","lund"
  ];

  // 1. VIOLENCE = RED 98
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

  // 2. ABUSE = MIN 30 - 65 (NEW FIX)
  const foundAbuse = abuseList.filter(w => lower.includes(w));
  if (foundAbuse.length > 0) {
    // try Gemini first to get emotion, but enforce min score
    try {
      const res = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, toneData })
      });
      const data = await res.json();
      // enforce at least 30, if multiple abuses or all caps -> 55-65
      let forcedScore = foundAbuse.length >= 3 ? 65 : foundAbuse.length >=2 ? 50 : 35;
      if (lower === lower.toUpperCase() && lower.length > 5) forcedScore += 10; // shouting
      const finalScore = Math.max(data.score || 0, forcedScore);
      let finalLevel = data.level || "YELLOW";
      if (finalScore >= 70) finalLevel = "RED";
      else if (finalScore >= 45) finalLevel = "ORANGE";
      else finalLevel = "YELLOW";

      return {
        level: finalLevel, riskLevel: finalLevel,
        score: finalScore,
        emotion: data.emotion || "angry",
        sentiment: "negative",
        reasons: [`abusive language detected: ${foundAbuse.slice(0,3).join(", ")}`, ...(data.reasons||[])],
        advice: data.advice || "Abuse shows high stress/anger. Try pausing, breathing 4-4-4-4, and rephrasing your feelings without slurs.",
        isCrisis: finalLevel === "RED",
        source: "abuse-forced-" + forcedScore
      };
    } catch {
      // offline fallback for abuse
      const score = foundAbuse.length >=2 ? 55 : 35;
      return {
        level: score >=45 ? "ORANGE" : "YELLOW", riskLevel: score >=45 ? "ORANGE" : "YELLOW",
        score: score, emotion: "angry", sentiment: "negative",
        reasons: [`abusive language: ${foundAbuse.join(", ")}`],
        advice: "High anger/abuse detected. Take a break, breathe, avoid acting while angry.",
        isCrisis: false, source: "client-abuse-force"
      };
    }
  }

  // 3. Normal Gemini
  try {
    const res = await fetch("/api/gemini", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, toneData })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    return {
      level: "YELLOW", riskLevel: "YELLOW", score: 30,
      emotion: "neutral", sentiment: "neutral",
      reasons: ["fallback"],
      advice: "Could not connect to AI, but noted.",
      isCrisis: false, source: "fallback"
    };
  }
}