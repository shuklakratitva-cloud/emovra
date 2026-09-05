import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";

export default function WellnessCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // FIX: `new Date()` + setMonth() overflows on long months. On March 31
  // with monthOffset -1, setMonth(1) means "Feb 31", which normalizes to
  // March 3 - so monthStr stayed "2026-03", the ‹ button appeared to do
  // nothing, and a second click jumped straight to January, making
  // February unreachable that day. Anchoring to day 1 removes the overflow.
  // Also build monthStr from local getFullYear/getMonth rather than
  // toISOString(), which converts to UTC and could disagree with the
  // locally-computed monthLabel across a timezone boundary.
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthStr = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = base.toLocaleString("default", { month: "long", year: "numeric" });

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${API}/insights/calendar?month=${monthStr}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setDays(d.days); setLoading(false); })
      .catch(() => setLoading(false));
  }, [monthStr]);

  const firstOfMonth = new Date(`${monthStr}-01T00:00:00Z`);

  const daysInMonth = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function colorFor(dateStr) {
    const info = days[dateStr];
    if (!info) return "transparent";
    return info.highestRisk === "RED" ? "#f87171" : "#fb923c";
  }

  const weekdayLabels = [
    t("wellnessCalendar.daySun"),
    t("wellnessCalendar.dayMon"),
    t("wellnessCalendar.dayTue"),
    t("wellnessCalendar.dayWed"),
    t("wellnessCalendar.dayThu"),
    t("wellnessCalendar.dayFri"),
    t("wellnessCalendar.daySat"),
  ];

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>📅 {t("wellnessCalendar.heading")}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMonthOffset((m) => m - 1)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", padding: "4px 10px" }}>‹</button>
          <button onClick={() => setMonthOffset((m) => m + 1)} disabled={monthOffset >= 0} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: monthOffset >= 0 ? "not-allowed" : "pointer", padding: "4px 10px", opacity: monthOffset >= 0 ? 0.4 : 1 }}>›</button>
        </div>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{monthLabel}</p>
      <p style={{ fontSize: 11, opacity: 0.5 }}>{t("wellnessCalendar.description")}</p>

      {loading ? <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>{t("wellnessCalendar.loading")}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 14 }}>
          {weekdayLabels.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, opacity: 0.5 }}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
            const dot = colorFor(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={i} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, border: isToday ? "2px solid var(--accent)" : "1px solid var(--border)", fontSize: 11 }}>
                <span style={{ color: isToday ? "var(--text-h)" : "var(--text)", fontWeight: isToday ? 700 : 400 }}>{day}</span>
                {dot !== "transparent" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, marginTop: 2 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
