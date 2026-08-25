export async function transcribeWithGroqWhisper(audioBuffer, mimetype) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const form = new FormData();
    const ext = mimetype?.includes("webm") ? "audio.webm" : mimetype?.includes("mp3") ? "audio.mp3" : "audio.wav";
    form.append("file", new Blob([audioBuffer], { type: mimetype || "audio/webm" }), ext);
    form.append("model", "whisper-large-v3");
    form.append("response_format", "json");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      console.error("Groq Whisper transcription failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    return data.text || null;
  } catch (e) {
    console.error("Groq Whisper error:", e.message);
    return null;
  }
}

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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
        temperature: 0.3,
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
    if (!["GREEN", "YELLOW", "ORANGE", "RED"].includes(parsed.risk)) parsed.risk = "ORANGE";
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
