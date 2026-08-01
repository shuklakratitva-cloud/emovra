import React, { useState } from "react";

// ============================================================
// "Choose your coping strategy" - pick how you're feeling, get a menu of
// concrete things to try right now
// ============================================================
const COPING_MAP = {
  Overwhelmed: ["Step away for 5 minutes, even just to another room", "Write down everything on your mind, then pick just one thing to focus on", "Try the 4-4-4 breathing exercise (Grounding & Support)"],
  Anxious: ["Name 5 things you can see, 4 you can hear, 3 you can touch", "Splash cold water on your face or hands", "Talk it through with someone you trust, even by text"],
  Sad: ["Let yourself feel it for a few minutes without trying to fix it", "Do one small comforting thing - a warm drink, a favorite song", "Reach out to one person, even just to say hi"],
  Angry: ["Step away before responding to anything", "Move your body - a short walk, some stretching", "Write out exactly what's bothering you, unfiltered, just for yourself"],
  Lonely: ["Message one person, even a small \"thinking of you\"", "Write in your journal instead of holding it in", "Do something around other people, even just a public space"],
  Tired: ["Give yourself permission to rest without guilt", "Do one small task, then stop - momentum doesn't require finishing everything", "Check if it's sleep-tired or emotionally worn out - they need different things"],
};

function CopingStrategy() {
  const [feeling, setFeeling] = useState(null);
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>What's closest to how you're feeling right now?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {Object.keys(COPING_MAP).map((f) => (
          <button key={f} onClick={() => setFeeling(f)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: feeling === f ? "1px solid var(--accent)" : "1px solid var(--border)", background: feeling === f ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>
            {f}
          </button>
        ))}
      </div>
      {feeling && (
        <div style={{ marginTop: 16 }}>
          {COPING_MAP[feeling].map((s, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < COPING_MAP[feeling].length - 1 ? "1px solid var(--border)" : "none", fontSize: 13, lineHeight: 1.5 }}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Spin-the-wheel self-care activity
// ============================================================
const SELF_CARE_ACTIVITIES = ["Drink a glass of water", "Step outside for 2 minutes", "Text someone you appreciate", "Stretch for a minute", "Write one sentence in your journal", "Play one song you love", "Tidy one small space", "Do absolutely nothing for 3 minutes", "Look at a photo that makes you smile", "Say one kind thing to yourself"];
function SelfCareWheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const picked = SELF_CARE_ACTIVITIES[Math.floor(Math.random() * SELF_CARE_ACTIVITIES.length)];
    setRotation((r) => r + 1080 + Math.random() * 360);
    setTimeout(() => { setResult(picked); setSpinning(false); }, 1800);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 140, height: 140, margin: "10px auto", borderRadius: "50%",
        background: "conic-gradient(from 0deg, #d4b07a, #a78bfa, #60a5fa, #4ade80, #fbbf24, #f87171, #d4b07a)",
        transform: `rotate(${rotation}deg)`, transition: "transform 1.8s cubic-bezier(0.2,0.8,0.2,1)",
        border: "3px solid var(--accent)",
      }} />
      <button onClick={spin} disabled={spinning} style={{ marginTop: 14, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        {spinning ? "Spinning..." : "Spin"}
      </button>
      {result && <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>{result}</p>}
    </div>
  );
}

// ============================================================
// Photography challenges - prompts to go DO, not a photo upload/gallery
// feature (kept deliberately simple, no new storage/moderation needed)
// ============================================================
const PHOTO_PROMPTS = ["Something that made you smile today", "A texture you like the feel of", "The sky, right now, whatever it looks like", "Something small you'd normally walk past", "A color that matches your mood", "Something that reminds you of somewhere you love", "Your favorite everyday object", "A shadow or reflection"];
function PhotoChallenge() {
  const [prompt, setPrompt] = useState(() => PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)]);
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Grab your phone or just look around - no upload needed, just notice.</p>
      <div style={{ marginTop: 16, padding: 20, borderRadius: 12, border: "1px solid var(--border)", fontSize: 15, color: "var(--text-h)" }}>📷 {prompt}</div>
      <button onClick={() => setPrompt(PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)])} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>
        New prompt
      </button>
    </div>
  );
}

const TABS = [
  { id: "coping", label: "🧭 Coping Strategy", Component: CopingStrategy },
  { id: "wheel", label: "🎡 Self-Care Wheel", Component: SelfCareWheel },
  { id: "photo", label: "📷 Photo Challenge", Component: PhotoChallenge },
];

export default function SelfCareTools() {
  const [active, setActive] = useState("coping");
  const Active = TABS.find((t) => t.id === active)?.Component;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🌿 Self-Care Tools</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === t.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === t.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === t.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === t.id ? 700 : 500 }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
