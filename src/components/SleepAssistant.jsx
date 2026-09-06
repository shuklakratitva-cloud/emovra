import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
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
