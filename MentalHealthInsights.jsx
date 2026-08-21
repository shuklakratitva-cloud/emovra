import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";

export default function MentalHealthInsights() {
  const [data, setData] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/insights/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>📊 {t("mentalHealthInsights.title")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
        {t("mentalHealthInsights.description")}
      </p>

      {!data ? <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>{t("mentalHealthInsights.loading")}</p> : (
        <>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(212,197,160,0.08)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.totalCheckIns}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{t("mentalHealthInsights.flaggedCheckInsSaved")}</div>
            </div>
            {data.topEmotion && (
              <div style={{ flex: 1, minWidth: 140, background: "rgba(212,197,160,0.08)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, textAlign: "center" }}>
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
    </div>
  );
}
