import React, { useState, useEffect } from "react";

const LS_KEY = "emovra_onboarding_seen";

const STEPS = [
  { emoji: "👋", title: "Welcome to Emovra", body: "A quick 30-second tour before you dive in - just the essentials." },
  { emoji: "💬", title: "Check-in", body: "Type how you're feeling, or use Voice & Mood to speak instead. This is where check-ins get looked at." },
  { emoji: "📖", title: "Journal", body: "Completely separate from Check-in - private, encrypted, and never analyzed by AI. A space to just write." },
  { emoji: "🧘", title: "Grounding & Support", body: "Guided exercises for hard moments, plus your emergency contact is always one tap away." },
  { emoji: "📊", title: "Dashboard", body: "Your levels, streaks, challenges, and a lot more wellness tools live here - Relax, Mind & Games, Creative, Reflect." },
  { emoji: "🛟", title: "One more thing", body: "In Dashboard → Reflect, there's a Safety Plan you can fill out now, while things are calm - it's there for you later if you ever need it." },
];

export default function OnboardingWalkthrough() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(LS_KEY, "true");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  }

  if (!visible) return null;
  const s = STEPS[step];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--card-bg, #16161a)", borderRadius: 20, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 48 }}>{s.emoji}</div>
        <h2 style={{ color: "var(--text-h)", marginTop: 12 }}>{s.title}</h2>
        <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6, marginTop: 8 }}>{s.body}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === step ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button onClick={close} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
            Skip
          </button>
          <button onClick={next} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {step < STEPS.length - 1 ? "Next" : "Let's go"}
          </button>
        </div>
      </div>
    </div>
  );
}
