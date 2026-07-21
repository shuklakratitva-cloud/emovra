export async function onRequestPost(context) {
  try {
    const { text, toneData } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "No API key" }), { status: 500 });

    const lower = text.toLowerCase();
    // IMMEDIATE keyword override - never miss violence
    const violenceKeywords = ["kill", "murder", "stab", "shoot", "hurt someone", "want to kill", "gonna kill", "i will kill", "choke him", "beat him", "revenge"];
    const selfHarmKeywords = ["disappeared", "no one would notice", "better off without me", "kill myself", "end my life", "suicide", "wanna die", "don't want to live"];
    let forcedLevel = null;
    if (violenceKeywords.some(k => lower.includes(k))) forcedLevel = "RED";
    if (selfHarmKeywords.some(k => lower.includes(k))) forcedLevel = "RED";

    const prompt = `You are Emovra India mental health + safety AI. Classify risk.

RULES - MUST FOLLOW:
- If user says they want to kill/hurt/murder/harm ANOTHER person ("i want to kill him/her/them", "i will murder", "i want to stab/shoot/hurt someone") = LEVEL RED, isCrisis true, score 95, emotion angry, sentiment negative
- If user says self-harm / suicide / "if i disappeared", "no one would notice", "better off dead", "kill myself" = LEVEL RED, isCrisis true
- If angry + revenge + violent plan = RED
- If passive hopeless = ORANGE or RED
- Never return GREEN if word kill/murder/stab/shoot present

User text: "${text}"
Voice data: ${JSON.stringify(toneData||{})}
Forced hint: ${forcedLevel || 'none'}

Return ONLY JSON: {"level":"RED","score":95,"emotion":"angry","sentiment":"negative","reasons":["homicidal ideation detected: wants to kill","requires immediate de-escalation"],"advice":"You are feeling intense anger. Pause, step away, breathe, do not act. Talk to a trusted person or counselor now.","isCrisis":true} No markdown.`;

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 400 } }) });
    const d = await r.json();
    let raw = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.replace(/```json|```/g, "").trim();
    let p; try { p = JSON.parse(raw); } catch { p = { level: forcedLevel || "RED", score: 95, emotion: "angry", sentiment: "negative", reasons: ["violence detected by keyword override"], advice: "Intense anger detected. Step away, breathe slowly, do not act on this thought. Talk to someone now.", isCrisis: true }; }

    // Force RED if our keyword caught it but Gemini missed
    if (forcedLevel === "RED") { p.level = "RED"; p.score = Math.max(p.score || 0, 95); p.isCrisis = true; }

    p.riskLevel = p.level; p.isCrisis = p.level === "RED"; if (p.isCrisis) p.helpline = "Tele-MANAS: 14416 | Kiran: 1800-599-0019 | If you may harm someone else, call 112 immediately and step away."; p.timestamp = new Date().toISOString(); p.source = "gemini-v2-violence";
    return new Response(JSON.stringify(p), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ level: "RED", riskLevel: "RED", score: 95, emotion: "angry", sentiment: "negative", reasons: ["violence keyword - safety override"], advice: "Strong anger detected. Please pause, do not act, talk to someone you trust.", isCrisis: true, helpline: "14416 / 1800-599-0019", source: "fallback-violence" }), { status: 200 }); }
}