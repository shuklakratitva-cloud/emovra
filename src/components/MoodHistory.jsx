import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";

// Merged from the former MentalHealthInsights.jsx + WellnessCalendar.jsx,
// which sat stacked as two separate cards on /dashboard/mood and read as
// two answers to the same question ("how have I been?"). They are one card
// now: the totals and feelings breakdown up top, the per-day risk heatmap
// below, under one heading.
//
// Deliberately still TWO fetches (/insights/summary and /insights/calendar)
// rather than one merged endpoint - the calendar re-fetches every time the
// month arrows move, and the summary must not be re-requested for that. So
// they keep independent loading states too: paging the calendar never blanks
// the stats above it.
export default function MoodHistory() {
  const { t } = useLanguage();

  // --- summary (was MentalHealthInsights) -------------------------------
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/insights/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(() => {});
  }, []);

  // --- calendar (was WellnessCalendar) ----------------------------------
  const [monthOffset, setMonthOffset] = useState(0);
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);

  // Carried over from the WellnessCalendar fix - do not "simplify" this back.
  // `new Date()` + setMonth() overflows on long months: on March 31 with
  // monthOffset -1, setMonth(1) means "Feb 31", which normalizes to March 3,
  // so monthStr stayed "2026-03", the < button appeared to do nothing, and a
  // second click jumped to January - February was unreachable that day.
  // Anchoring to day 1 removes the overflow. monthStr is also built from
  // local getFullYear/getMonth rather than toISOString(), which converts to
  // UTC and could disagree with the locally-computed monthLabel across a
  // timezone boundary.
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

  const statCard = {
    flex: 1, minWidth: 140, background: "rgba(212,197,160,0.08)",
    border: "1px solid var(--border)", borderRadius: 12, padding: 14, textAlign: "center",
  };

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>📊 {t("mentalHealthInsights.title")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
        {t("mentalHealthInsights.description")}
      </p>

      {!data ? <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>{t("mentalHealthInsights.loading")}</p> : (
        <>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <div style={statCard}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.totalCheckIns}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{t("mentalHealthInsights.flaggedCheckInsSaved")}</div>
            </div>
            {data.topEmotion && (
              <div style={statCard}>
                <div style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize" }}>{data.topEmotion}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{t("mentalHealthInsights.mostCommonFeeling")}</div>
              </div>
            )}
          </div>

          {Object.keys(data.emotionCounts || {}).length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{t("mentalHealthInsights.feelingsBreakdown")}</div>
              {Object.entries(data.emotionCounts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => {
                const max = Math.max(...Object.values(data.emotionCounts));
                return (
                  <div key={emotion} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, width: 90, textTransform: "capitalize" }}>{emotion}</span>
                    <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: "#d4b07a" }} />
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.6, width: 20 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {data.totalCheckIns === 0 && (
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>{t("mentalHealthInsights.emptyState")}</p>
          )}
        </>
      )}

      <div style={{ marginTop: 22, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>📅 {t("wellnessCalendar.heading")}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setMonthOffset((m) => m - 1)}
              aria-label={t("wellnessCalendar.heading")}
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", padding: "4px 10px" }}
            >‹</button>
            <button
              onClick={() => setMonthOffset((m) => m + 1)}
              disabled={monthOffset >= 0}
              aria-label={t("wellnessCalendar.heading")}
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: monthOffset >= 0 ? "not-allowed" : "pointer", padding: "4px 10px", opacity: monthOffset >= 0 ? 0.4 : 1 }}
            >›</button>
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
    </div>
  );
}
