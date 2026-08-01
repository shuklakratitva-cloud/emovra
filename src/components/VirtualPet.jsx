import React from "react";

// Grows through stages based on the person's EXISTING level (already
// tracked server-side via the gamification system) - deliberately no new
// backend model or persistence needed, just a visual layer on data that
// already exists.
const STAGES = [
  { minLevel: 1, emoji: "🥚", name: "Egg" },
  { minLevel: 2, emoji: "🐣", name: "Hatchling" },
  { minLevel: 4, emoji: "🐥", name: "Chick" },
  { minLevel: 7, emoji: "🦆", name: "Fledgling" },
  { minLevel: 10, emoji: "🦢", name: "Grown" },
  { minLevel: 15, emoji: "🕊", name: "Soaring" },
];

function stageFor(level) {
  let current = STAGES[0];
  for (const s of STAGES) {
    if (level >= s.minLevel) current = s;
  }
  return current;
}

export default function VirtualPet({ level = 1, xp = 0 }) {
  const stage = stageFor(level);
  const nextStage = STAGES.find((s) => s.minLevel > level);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, lineHeight: 1 }}>{stage.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-h)", marginTop: 8 }}>{stage.name}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
        {nextStage ? `Grows into a ${STAGES[STAGES.indexOf(nextStage)].name.toLowerCase()} at level ${nextStage.minLevel}` : "Fully grown"}
      </div>
      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6 }}>Grows as you level up - keep checking in and building habits</div>
    </div>
  );
}
