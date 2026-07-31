// backend/utils/groqFallback.js
//
// Free fallback for the CHATBOT specifically (routes/chatbot.js): if Gemini
// fails, try Groq before falling back to a generic "I'm having trouble"
// reply. Groq's free tier is generous and fast - good fit for a
// conversational fallback where the stakes are lower than the crisis
// CLASSIFICATION path (that classification still runs independently via
// the keyword safety net in chatbot.js, regardless of which AI generated
// the conversational reply - this file only affects what the chatbot SAYS
// back, never whether a risky message gets caught).
//
// REQUIRES: GROQ_API_KEY env var (free - sign up at https://console.groq.com).
// No extra npm package needed - Groq's API is OpenAI-compatible, so this
// just uses plain fetch. If the key isn't set, silently returns null and
// the caller uses its existing generic fallback reply.
//
// GROQ_MODEL env var lets you pick the model without a code change -
// check https://console.groq.com/docs/models for Groq's current free
// model lineup, since hosted model availability changes over time.
// Defaults to a Llama 3.3 70B variant, a solid general-purpose free choice
// as of when this was written.

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// NEW: classification-mode call for the text/voice analysis pipeline -
// distinct from chatWithGroq() below, which is for the chatbot's
// free-form conversational replies. This one expects the same
// SYSTEM_PROMPT/JSON-output contract as the Gemini classification calls in
// analyze.js/emotion.js/voice.js, so it's a drop-in third tier in that
// chain: Gemini -> Groq -> localRiskFallback.
export async function classifyWithGroq(systemPrompt, text) {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Text: "${text}"` },
        ],
        max_tokens: 300,
        temperature: 0.3, // lower than the chatbot's 0.7 - classification should be consistent, not creative
      }),
    });

    if (!res.ok) {
      console.error("Groq classify error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!["GREEN", "ORANGE", "RED"].includes(parsed.risk)) parsed.risk = "ORANGE";
    if (!parsed.triggers || parsed.triggers.includes("error")) parsed.triggers = ["general"];
    if (!parsed.category) parsed.category = parsed.abuseType?.includes("school") ? "school_emotional_abuse" : "general";
    if (!parsed.abuseType) parsed.abuseType = parsed.category.includes("school") ? "school_emotional_abuse" : "none";
    if (!parsed.abuseSource) parsed.abuseSource = parsed.abuseType === "school_emotional_abuse" ? "teacher" : "none";
    return parsed;
  } catch (e) {
    console.error("Groq classify fetch failed:", e.message?.slice(0, 200));
    return null;
  }
}

export async function chatWithGroq(systemPrompt, transcript) {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("Groq error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch (e) {
    console.error("Groq fetch failed:", e.message?.slice(0, 200));
    return null;
  }
}
