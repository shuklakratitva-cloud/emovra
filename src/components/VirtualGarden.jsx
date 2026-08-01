import React, { useState, useEffect } from "react";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// Blooms based on EXISTING completed-goals count (Goal model already
// tracks `completed` per goal) - no new backend state needed, just a
// visual layer, same pattern as VirtualPet.jsx. Self-contained: fetches
// its own data from the existing /api/goals endpoint rather than needing
// Dashboard.jsx to be restructured to pass goal data down.
const GROWTH_STAGES = [
  { min: 0, emoji: "🟫", name: "Bare soil" },
  { min: 1, emoji: "🌱", name: "Sprouting" },
  { min: 2, emoji: "🌿", name: "Growing" },
  { min: 4, emoji: "🌷", name: "Budding" },
  { min: 6, emoji: "🌸", name: "Blooming" },
  { min: 10, emoji: "🌳", name: "Flourishing" },
];

function stageFor(count) {
  let current = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) if (count >= s.min) current = s;
  return current;
}

export default function VirtualGarden() {
  const [completedGoals, setCompletedGoals] = useState(0);

  useEffect(() => {
    fetch(`${API}/goals`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCompletedGoals(d.goals.filter((g) => g.completed).length); })
      .catch(() => {});
  }, []);

  const stage = stageFor(completedGoals);
  const next = GROWTH_STAGES.find((s) => s.min > completedGoals);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <div style={{ fontSize: 56 }}>{stage.emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h)", marginTop: 6 }}>{stage.name}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
        {completedGoals} goal{completedGoals !== 1 ? "s" : ""} completed
        {next ? ` - blooms further after ${next.min - completedGoals} more` : " - fully bloomed"}
      </div>
    </div>
  );
}
