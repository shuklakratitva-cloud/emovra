 export async function onRequestPost(context) {
  try {
    const { text, toneData } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "No API key" }), { status: 500 });
    const prompt = `You are Emovra mental health screening assistant for India. You are NOT a doctor. User said: "${text}" Voice: ${JSON.stringify(toneData||{})} Analyze emotion and risk. If phrase like "if i disappeared", "no one would notice", "better off without me" = RED minimum. If RED give Tele-MANAS 14416, Kiran 1800-599-0019. Return ONLY JSON: {"level":"RED","score":92,"emotion":"sad","sentiment":"negative","reasons":["...","..."],"advice":"...","isCrisis":true} No markdown.`;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 350 } }) });
    const d = await r.json();
    let raw = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.replace(/```json|```/g, "").trim();
    let p; try { p = JSON.parse(raw); } catch { p = { level: "YELLOW", score: 45, emotion: "mixed", sentiment: "neutral", reasons: ["needs review"], advice: "Talk to someone you trust and breathe slowly.", isCrisis: false }; }
    p.riskLevel = p.level; p.isCrisis = p.level === "RED"; if (p.isCrisis) p.helpline = "Tele-MANAS: 14416 | Kiran: 1800-599-0019"; p.timestamp = new Date().toISOString(); p.source = "gemini";
    return new Response(JSON.stringify(p), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ level: "YELLOW", riskLevel: "YELLOW", score: 40, emotion: "mixed", reasons: ["error"], advice: "Try again. If distressed call 14416.", isCrisis: false }), { status: 200 }); }
}
