// src/components/MoodTracker.jsx
import React from "react";
import useMood from "../hooks/useMood";

const MOOD_ORDER = ["Happy","Calm","Neutral","Sad","Anxious","Angry","Lonely","Overwhelmed"];

const MOODS = [
  { label: "Happy", emoji: "😊", color: "#4ade80" },
  { label: "Calm", emoji: "😌", color: "#60a5fa" },
  { label: "Neutral", emoji: "😐", color: "#d4c5a0" },
  { label: "Sad", emoji: "😢", color: "#818cf8" },
  { label: "Anxious", emoji: "😰", color: "#fb923c" },
  { label: "Angry", emoji: "😠", color: "#f87171" },
  { label: "Lonely", emoji: "🥺", color: "#a78bfa" },
  { label: "Overwhelmed", emoji: "😞", color: "#f472b6" },
];

// NEW: replaces the plain rectangular mood buttons - bigger, playful,
// "sticker" style tap targets.
function MoodSticker({ mood, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "12px 10px",
        borderRadius: 18,
        cursor: "pointer",
        border: active ? `2px solid ${mood.color}` : "1px solid var(--border)",
        background: active ? `${mood.color}22` : "var(--card-bg)",
        minWidth: 76,
        transform: active ? "scale(1.06) rotate(-2deg)" : "scale(1)",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <span style={{ fontSize: 30, lineHeight: 1 }}>{mood.emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{mood.label}</span>
    </button>
  );
}

// NEW: compact SVG bar graph replacing the old text list + growing card
// history - same information (frequency per mood + a recent trend), far
// less vertical space.
function MoodGraph({ moodStats, moodHistory }) {
  const width = 600;
  const barHeight = 22;
  const gap = 10;
  const labelWidth = 90;
  const maxCount = Math.max(1, ...Object.values(moodStats));

  const rows = MOOD_ORDER.filter((m) => moodStats[m]).map((m) => ({
    label: m,
    count: moodStats[m],
    color: MOODS.find((x) => x.label === m)?.color || "#d4c5a0",
    emoji: MOODS.find((x) => x.label === m)?.emoji || "•",
  }));

  const height = Math.max(1, rows.length) * (barHeight + gap);

  // recent trend strip - last 14 entries, oldest to newest
  const recent = [...moodHistory].slice(0, 14).reverse();

  return (
    <div>
      {rows.length === 0 ? (
        <p style={{ opacity: 0.6, fontSize: 13 }}>No mood data yet - tap a sticker above to log one.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {rows.map((row, i) => {
            const y = i * (barHeight + gap);
            const barW = (row.count / maxCount) * (width - labelWidth - 40);
            return (
              <g key={row.label}>
                <text x={0} y={y + barHeight * 0.7} fontSize="13" fill="var(--text)">
                  {row.emoji} {row.label}
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
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Recent trend</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            {recent.map((e, i) => (
              <span key={e.id || i} title={new Date(e.timestamp).toLocaleString()} style={{ fontSize: 18 }}>
                {MOODS.find((m) => m.label === e.mood)?.emoji || "•"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoodTracker() {
  const { currentMood, moodHistory, moodStats, addMood, removeMood, clearMoodHistory } = useMood();

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>😊 Mood Tracker</h2>
      <p>Select how you're feeling today.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", marginTop: "12px" }}>
        {MOODS.map((mood) => (
          <MoodSticker
            key={mood.label}
            mood={mood}
            active={currentMood === mood.label}
            onClick={() => addMood(mood.label)}
          />
        ))}
      </div>

      {currentMood && <p><strong>Current Mood:</strong> {currentMood}</p>}
      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <h3 style={{ marginBottom: 10 }}>Mood History</h3>
      <MoodGraph moodStats={moodStats} moodHistory={moodHistory} />

      {moodHistory.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {moodHistory[0] && (
            <button onClick={() => removeMood(moodHistory[0].id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
              Undo last
            </button>
          )}
          <button onClick={clearMoodHistory} style={{ fontSize: 12, background: "#dc2626", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Clear Mood History
          </button>
        </div>
      )}
    </div>
  );
}
