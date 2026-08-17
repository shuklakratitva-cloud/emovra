import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// ============================================================
// Breathing Circle - expands/contracts on a 4-4-4 rhythm, same timing as
// the breathing exercise already in SleepAssistant, but as a dedicated
// full-size visual here instead of a small inline timer.
// ============================================================
function BreathingCircle() {
  const [phase, setPhase] = useState("in"); // in | hold | out
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(4);
  const { t } = useLanguage();

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        setPhase((p) => (p === "in" ? "hold" : p === "hold" ? "out" : "in"));
        return 4;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const label = phase === "in" ? t("relaxationGames.breatheIn") : phase === "hold" ? t("relaxationGames.hold") : t("relaxationGames.breatheOut");
  const scale = phase === "in" ? 1.4 : phase === "hold" ? 1.4 : 0.7;

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ width: 200, height: 200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,176,122,0.5), rgba(212,176,122,0.1))",
          border: "2px solid var(--accent)",
          transform: `scale(${running ? scale : 1})`,
          transition: "transform 3.8s ease-in-out",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h)" }}>{running ? label : t("relaxationGames.ready")}</span>
        </div>
      </div>
      <button onClick={() => setRunning((r) => !r)} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        {running ? t("relaxationGames.stop") : t("relaxationGames.startBreathing")}
      </button>
    </div>
  );
}

// ============================================================
// Virtual Stress Ball - click and hold to squish, releases back
// ============================================================
function StressBall() {
  const [squished, setSquished] = useState(false);
  const [pops, setPops] = useState(0);
  const { t } = useLanguage();
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div
        onMouseDown={() => { setSquished(true); setPops((p) => p + 1); }}
        onMouseUp={() => setSquished(false)}
        onMouseLeave={() => setSquished(false)}
        onTouchStart={() => { setSquished(true); setPops((p) => p + 1); }}
        onTouchEnd={() => setSquished(false)}
        style={{
          width: 130, height: 130, margin: "0 auto", borderRadius: "50%", cursor: "pointer", userSelect: "none",
          background: "radial-gradient(circle at 35% 30%, #f4a261, #e07a3f)",
          transform: squished ? "scale(0.82, 1.15)" : "scale(1,1)",
          transition: "transform 0.15s ease",
          boxShadow: squished ? "0 2px 8px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.25)",
        }}
      />
      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>{t("relaxationGames.stressBallHint", { count: pops })}</p>
    </div>
  );
}

// ============================================================
// Bubble Pop - grid of poppable bubbles, resets when all popped
// ============================================================
function BubblePop() {
  const GRID = 30;
  const [popped, setPopped] = useState(() => new Array(GRID).fill(false));
  const { t } = useLanguage();

  function pop(i) {
    setPopped((arr) => {
      const next = [...arr];
      next[i] = true;
      return next;
    });
  }
  function reset() {
    setPopped(new Array(GRID).fill(false));
  }

  const allPopped = popped.every(Boolean);

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, maxWidth: 280, margin: "0 auto" }}>
        {popped.map((isPopped, i) => (
          <button
            key={i}
            onClick={() => !isPopped && pop(i)}
            disabled={isPopped}
            style={{
              width: 40, height: 40, borderRadius: "50%", border: "none", cursor: isPopped ? "default" : "pointer",
              background: isPopped ? "rgba(212,197,160,0.08)" : "radial-gradient(circle at 35% 30%, rgba(212,176,122,0.9), rgba(212,176,122,0.4))",
              transform: isPopped ? "scale(0.5)" : "scale(1)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
          />
        ))}
      </div>
      {allPopped ? (
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
          {t("relaxationGames.refillBubbles")}
        </button>
      ) : (
        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>{t("relaxationGames.bubblesPopped", { popped: popped.filter(Boolean).length, total: GRID })}</p>
      )}
    </div>
  );
}

const GAMES = [
  { id: "breathe", emoji: "🫧", labelKey: "relaxationGames.breathingTab", Component: BreathingCircle },
  { id: "ball", emoji: "🤏", labelKey: "relaxationGames.stressBallTab", Component: StressBall },
  { id: "pop", emoji: "🫧", labelKey: "relaxationGames.bubblePopTab", Component: BubblePop },
];

export default function RelaxationGames() {
  const [active, setActive] = useState("breathe");
  const { t } = useLanguage();
  const ActiveGame = GAMES.find((g) => g.id === active)?.Component;

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🎮 {t("relaxationGames.heading")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("relaxationGames.subtitle")}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g.id)}
            style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: active === g.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: active === g.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: active === g.id ? "var(--text-h)" : "var(--muted)",
              fontWeight: active === g.id ? 700 : 500,
            }}
          >
            {g.emoji} {t(g.labelKey)}
          </button>
        ))}
      </div>
      {ActiveGame && <ActiveGame />}
    </div>
  );
}
