import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// NOTE: this is a simple heuristic (days since last update), not actual
// machine-learning prediction - being upfront about that rather than
// overclaiming "AI" for what's really just a staleness check.
export default function GoalReminders() {
  const [stale, setStale] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`${API}/goals`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const now = Date.now();
        const flagged = d.goals
          .filter((g) => !g.completed)
          .map((g) => ({ ...g, daysSince: Math.floor((now - new Date(g.updatedAt || g.createdAt).getTime()) / 86400000) }))
          .filter((g) => g.daysSince >= 7)
          .sort((a, b) => b.daysSince - a.daysSince);
        setStale(flagged);
      })
      .catch(() => {});
  }, []);

  if (stale.length === 0) return null;

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>🗺 {t("goalReminders.heading")}</h3>
      <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{t("goalReminders.subtitle")}</p>
      {stale.slice(0, 4).map((g) => (
        <div key={g._id} style={{ padding: "8px 0", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>{g.title}</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>{t("goalReminders.daysQuiet", { days: g.daysSince })}</span>
        </div>
      ))}
    </div>
  );
}
