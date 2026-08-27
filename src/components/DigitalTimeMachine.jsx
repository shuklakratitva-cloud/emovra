import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { decryptLocal } from "../utils/localCipher.js";

export default function DigitalTimeMachine() {
  const { t } = useLanguage();
  const [thisMonth, setThisMonth] = useState({});
  const [lastMonth, setLastMonth] = useState({});
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    try {
      // FIX: this read the raw localStorage value and JSON.parse'd it
      // directly, but storage.js's saveMood() writes this key through
      // encryptLocal() (XOR + base64, not valid JSON) - so JSON.parse
      // always threw, was swallowed by the catch below, and this feature
      // silently showed as empty for every user with real mood history.
      const raw = localStorage.getItem("mental_health_mood_history");
      const history = raw ? JSON.parse(decryptLocal(raw)) : [];
      if (!history.length) return;
      setHasData(true);

      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;

      const thisCounts = {},
        lastCounts = {};
      history.forEach((h) => {
        const d = new Date(h.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key === thisMonthKey) thisCounts[h.mood] = (thisCounts[h.mood] || 0) + 1;
        else if (key === lastMonthKey) lastCounts[h.mood] = (lastCounts[h.mood] || 0) + 1;
      });
      setThisMonth(thisCounts);
      setLastMonth(lastCounts);
    } catch {}
  }, []);

  const topMood = (counts) => {
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  if (!hasData) {
    return (
      <div
        style={{
          background: "var(--card-bg, #fff)",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
          marginTop: "20px",
        }}
      >
        <h2>⏳ {t("digitalTimeMachine.heading")}</h2>
        <p style={{ fontSize: 12, opacity: 0.6 }}>{t("digitalTimeMachine.emptyState")}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--card-bg, #fff)",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        marginTop: "20px",
      }}
    >
      <h2>⏳ {t("digitalTimeMachine.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("digitalTimeMachine.subtitle")}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: 150,
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>{t("digitalTimeMachine.lastMonth")}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            {topMood(lastMonth) || t("digitalTimeMachine.noData")}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
            {t("digitalTimeMachine.moodEntriesCount", {
              count: Object.values(lastMonth).reduce((a, b) => a + b, 0),
            })}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 150,
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--accent)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>{t("digitalTimeMachine.thisMonth")}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: "var(--text-h)" }}>
            {topMood(thisMonth) || t("digitalTimeMachine.noData")}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
            {t("digitalTimeMachine.moodEntriesCount", {
              count: Object.values(thisMonth).reduce((a, b) => a + b, 0),
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
