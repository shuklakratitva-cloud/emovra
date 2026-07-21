export async function analyzeWithGemini(text, toneData = null) {
  const lower = text.toLowerCase();
  // CLIENT-SIDE FORCE - never green if kill present
  const violence = ["kill","murder","stab","shoot","hurt him","hurt her","kill him","kill her","want to kill","gonna kill","i will kill"];
  if (violence.some(k => lower.includes(k))) {
    return {
      level: "RED", riskLevel: "RED", score: 98,
      emotion: "angry", sentiment: "negative",
      reasons: ["homicidal ideation: '" + text + "'","client-side violence override"],
      advice: "Intense anger detected. Stop. Breathe. Do not act. Step away and talk to someone now.",
      isCrisis: true,
      helpline: "Tele-MANAS 14416 | If you may act, call 112",
      source: "client-force-RED"
    };
  }

  try {
    const res = await fetch("/api/gemini", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, toneData })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    // fallback still RED if contains kill
    return {
      level: "RED", score: 95, riskLevel: "RED",
      emotion: "angry", sentiment: "negative",
      reasons: ["fallback violence detection"],
      advice: "Please pause and seek help.",
      isCrisis: true, source: "fallback"
    };
  }
}