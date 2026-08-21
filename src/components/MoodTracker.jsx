import React from "react";
import useMood from "../hooks/useMood";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";

function pingMoodCheckin() {
  const token = localStorage.getItem("token");
  if (!token) return;
  fetch(`${API}/activity/mood-checkin`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}

const MOOD_ORDER = ["Happy","Calm","Neutral","Sad","Anxious","Angry","Lonely","Overwhelmed","Don't Know What To Do","Everything Fell On You At Once"];

const MOOD_LABEL_KEY = {
  "Happy": "moodTracker.moodHappy",
  "Calm": "moodTracker.moodCalm",
  "Neutral": "moodTracker.moodNeutral",
  "Sad": "moodTracker.moodSad",
  "Anxious": "moodTracker.moodAnxious",
  "Angry": "moodTracker.moodAngry",
  "Lonely": "moodTracker.moodLonely",
  "Overwhelmed": "moodTracker.moodOverwhelmed",
  "Don't Know What To Do": "moodTracker.moodDontKnow",
  "Everything Fell On You At Once": "moodTracker.moodOverload",
};
function moodLabel(t, label) {
  return t(MOOD_LABEL_KEY[label] || label);
}

const MOODS = [
  { label: "Happy", sticker: "/stickers/happy.png", color: "#4ade80" },
  { label: "Calm", sticker: "/stickers/calm.png", color: "#60a5fa" },
  { label: "Neutral", sticker: "/stickers/neutral.png", color: "#d4c5a0" },
  { label: "Sad", sticker: "/stickers/sad.png", color: "#818cf8" },
  { label: "Anxious", sticker: "/stickers/anxious.png", color: "#fb923c" },
  { label: "Angry", sticker: "/stickers/angry.png", color: "#f87171" },
  { label: "Lonely", sticker: "/stickers/lonely.png", color: "#a78bfa" },
  { label: "Overwhelmed", sticker: "/stickers/overwhelmed.png", color: "#f472b6" },
  { label: "Don't Know What To Do", sticker: "/stickers/dont-know.png", color: "#fbbf24" },
  { label: "Everything Fell On You At Once", sticker: "/stickers/everything-at-once.png", color: "#f97316" },
];

function MoodSticker({ mood, active, onClick }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "10px 10px",
        borderRadius: 18,
        cursor: "pointer",
        border: active ? `2px solid ${mood.color}` : "1px solid var(--border)",
        background: active ? `${mood.color}22` : "var(--card-bg)",
        minWidth: 96,
        transform: active ? "scale(1.06) rotate(-2deg)" : "scale(1)",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <img src={mood.sticker} alt={moodLabel(t, mood.label)} style={{ width: 64, height: 64, objectFit: "contain" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", textAlign: "center", lineHeight: 1.2 }}>{moodLabel(t, mood.label)}</span>
    </button>
  );
}

function MoodGraph({ moodStats, moodHistory }) {
  const { t } = useLanguage();
  const width = 600;
  const barHeight = 22;
  const gap = 10;
  const labelWidth = 150;
  const maxCount = Math.max(1, ...Object.values(moodStats));

  const rows = MOOD_ORDER.filter((m) => moodStats[m]).map((m) => ({
    label: m,
    count: moodStats[m],
    color: MOODS.find((x) => x.label === m)?.color || "#d4c5a0",
  }));

  const height = Math.max(1, rows.length) * (barHeight + gap);

  const recent = [...moodHistory].slice(0, 14).reverse();

  return (
    <div>
      {rows.length === 0 ? (
        <p style={{ opacity: 0.6, fontSize: 13 }}>{t("moodTracker.noMoodData")}</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {rows.map((row, i) => {
            const y = i * (barHeight + gap);
            const barW = (row.count / maxCount) * (width - labelWidth - 40);
            return (
              <g key={row.label}>
                <text x={0} y={y + barHeight * 0.7} fontSize="13" fill="var(--text)">
                  {moodLabel(t, row.label)}
                </text>
                <rect x={labelWidth} y={y} width={barW} height={barHeight} rx={6} fill={row.color} opacity="0.85" />
                <text x={labelWidth + barW + 8} y={y + barHeight * 0.7} fontSize="12" fill="var(--muted)">
                  {row.count}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {recent.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>{t("moodTracker.recentTrend")}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexWrap: "wrap" }}>
            {recent.map((e, i) => (
              <img
                key={e.id || i}
                title={new Date(e.timestamp).toLocaleString()}
                src={MOODS.find((m) => m.label === e.mood)?.sticker}
                alt={moodLabel(t, e.mood)}
                style={{ width: 26, height: 26, objectFit: "contain" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoodTracker() {
  const { currentMood, moodHistory, moodStats, addMood, removeMood, clearMoodHistory } = useMood();
  const { t } = useLanguage();

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>😊 {t("moodTracker.heading")}</h2>
      <p>{t("moodTracker.subtitle")}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", marginTop: "12px" }}>
        {MOODS.map((mood) => (
          <MoodSticker
            key={mood.label}
            mood={mood}
            active={currentMood === mood.label}
            onClick={() => { addMood(mood.label); pingMoodCheckin(); }}
          />
        ))}
      </div>

      {currentMood && <p><strong>{t("moodTracker.currentMood")}</strong> {moodLabel(t, currentMood)}</p>}
      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <h3 style={{ marginBottom: 10 }}>{t("moodTracker.historyHeading")}</h3>
      <MoodGraph moodStats={moodStats} moodHistory={moodHistory} />

      {moodHistory.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {moodHistory[0] && (
            <button onClick={() => removeMood(moodHistory[0].id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
              {t("moodTracker.undoLast")}
            </button>
          )}
          <button onClick={clearMoodHistory} style={{ fontSize: 12, background: "#dc2626", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 8, cursor: "pointer" }}>
            {t("moodTracker.clearHistory")}
          </button>
        </div>
      )}
    </div>
  );
}
