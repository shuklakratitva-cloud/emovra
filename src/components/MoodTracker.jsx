// src/components/MoodTracker.jsx

import React from "react";
import useMood from "../hooks/useMood";

export default function MoodTracker() {
  const { currentMood, moodHistory, moodStats, addMood, removeMood, clearMoodHistory } = useMood();

  const moods = [
    { label: "Happy", emoji: "😊" },
    { label: "Calm", emoji: "😌" },
    { label: "Neutral", emoji: "😐" },
    { label: "Sad", emoji: "😢" },
    { label: "Anxious", emoji: "😰" },
    { label: "Angry", emoji: "😠" },
    { label: "Lonely", emoji: "🥺" },
    { label: "Overwhelmed", emoji: "😞" },
  ];

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>😊 Mood Tracker</h2>
      <p>Select how you're feeling today.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", marginTop: "12px" }}>
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => addMood(mood.label)}
            aria-pressed={currentMood === mood.label}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              border: currentMood === mood.label ? "2px solid #2563eb" : "1px solid #ddd",
              background: currentMood === mood.label ? "#eff6ff" : "#fff",
            }}
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>

      {currentMood && <p><strong>Current Mood:</strong> {currentMood}</p>}
      <hr />

      <h3>Mood Statistics</h3>
      {Object.keys(moodStats).length === 0 ? <p>No mood data yet.</p> : (
        <ul>{Object.entries(moodStats).map(([mood, count]) => <li key={mood}>{mood}: {count}</li>)}</ul>
      )}
      <hr />

      <h3>Mood History</h3>
      {moodHistory.length === 0 ? <p>No moods recorded.</p> : (
        moodHistory.map((entry) => (
          <div key={entry.id} style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
            <strong>{entry.mood}</strong><br />
            <small>{new Date(entry.timestamp).toLocaleString()}</small><br />
            <button onClick={() => removeMood(entry.id)} style={{ marginTop: "8px" }}>Delete</button>
          </div>
        ))
      )}

      {moodHistory.length > 0 && (
        <button onClick={clearMoodHistory} style={{ marginTop: "15px", background: "#dc2626", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "10px", cursor: "pointer" }}>
          Clear Mood History
        </button>
      )}
    </div>
  );
}