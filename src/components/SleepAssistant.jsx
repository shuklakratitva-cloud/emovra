import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function BreathingTimer() {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("idle"); // idle | inhale | hold | exhale
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  function start() {
    setRunning(true);
    const cycle = () => {
      setPhase("inhale");
      timerRef.current = setTimeout(() => {
        setPhase("hold");
        timerRef.current = setTimeout(() => {
          setPhase("exhale");
          timerRef.current = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };
    cycle();
  }

  function stop() {
    clearTimeout(timerRef.current);
    setRunning(false);
    setPhase("idle");
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const size = phase === "inhale" ? 140 : phase === "hold" ? 140 : 80;
  const label = {
    idle: t("sleepAssistant.phaseReady"),
    inhale: t("sleepAssistant.phaseInhale"),
    hold: t("sleepAssistant.phaseHold"),
    exhale: t("sleepAssistant.phaseExhale"),
  }[phase];

  return (
    <div style={{ textAlign: "center", marginTop: 16 }}>
      <div style={{
        width: 140, height: 140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,176,122,0.4), rgba(212,176,122,0.05))",
          border: "1px solid #d4b07a",
          transition: "width 4s ease, height 4s ease",
        }} />
      </div>
      <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>{label}</p>
      {!running ? (
        <button onClick={start} style={{ marginTop: 8, background: "#d4b07a", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}>{t("sleepAssistant.startBreathing")}</button>
      ) : (
        <button onClick={stop} style={{ marginTop: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 18px", borderRadius: 999, cursor: "pointer" }}>{t("sleepAssistant.stop")}</button>
      )}
    </div>
  );
}

export default function SleepAssistant() {
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [quality, setQuality] = useState(3);
  const [saved, setSaved] = useState(false);
  const { t } = useLanguage();

  async function saveLog() {
    try {
      const res = await fetch(`${API}/sleep`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ bedtime, wakeTime, quality }) });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch {}
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🌙 {t("sleepAssistant.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{t("sleepAssistant.subtitle")}</p>

      <BreathingTimer />

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("sleepAssistant.logLastNight")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />
          <select value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
            {[1,2,3,4,5].map((q) => <option key={q} value={q}>{"⭐".repeat(q)}</option>)}
          </select>
          <button onClick={saveLog} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "8px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            {saved ? t("sleepAssistant.saved") : t("sleepAssistant.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
