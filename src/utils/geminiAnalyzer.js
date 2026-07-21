import { analyzeRisk } from "./analyzeRisk.js";
export async function analyzeWithGemini(text, toneData = null) {
  if (!text ||!text.trim()) return null;
  try {
    const res = await fetch("/api/gemini", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, toneData, mode: toneData? "voice" : "text" }) });
    if (!res.ok) throw new Error("fail");
    return await res.json();
  } catch (err) {
    const fb = analyzeRisk(text);
    if (toneData) { const pa = parseFloat(toneData.pauseRatio)||0; if (pa>40) { fb.score=Math.min(100,fb.score+20); if(fb.score>=75) fb.level=fb.riskLevel="RED"; } }
    return {...fb, source: "keyword-fallback" };
  }
}