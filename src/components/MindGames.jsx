import React, { useState } from "react";

// ============================================================
// Gratitude Bingo - check off prompts, aim for a full row
// ============================================================
function GratitudeBingo() {
  const PROMPTS = ["Someone who made you smile", "A meal you enjoyed", "Something that made you laugh", "A place you feel safe", "A song you love", "Something your body let you do today", "A small comfort", "A memory you're glad you have", "Something you're looking forward to"];
  const [checked, setChecked] = useState(() => new Array(9).fill(false));
  function toggle(i) { setChecked((c) => { const n = [...c]; n[i] = !n[i]; return n; }); }
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Tap a square once it's true for you today.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 10 }}>
        {PROMPTS.map((p, i) => (
          <button key={i} onClick={() => toggle(i)} style={{ padding: 10, borderRadius: 8, fontSize: 11, minHeight: 70, cursor: "pointer", border: checked[i] ? "1px solid var(--accent)" : "1px solid var(--border)", background: checked[i] ? "rgba(212,176,122,0.2)" : "transparent", color: "var(--text)" }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Positivity Scavenger Hunt - find/do small real-world things
// ============================================================
function ScavengerHunt() {
  const ITEMS = ["Something the color blue", "A sound you find calming", "Something soft nearby", "A plant or anything green", "Something that smells good", "A photo that makes you smile", "Something you haven't noticed in a while", "Natural light somewhere nearby"];
  const [found, setFound] = useState(() => new Array(8).fill(false));
  function toggle(i) { setFound((f) => { const n = [...f]; n[i] = !n[i]; return n; }); }
  const count = found.filter(Boolean).length;
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{count}/{ITEMS.length} found - look around you right now.</p>
      {ITEMS.map((item, i) => (
        <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid var(--accent)", background: found[i] ? "var(--accent)" : "transparent" }} />
          <span style={{ fontSize: 13, opacity: found[i] ? 0.5 : 1, textDecoration: found[i] ? "line-through" : "none" }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

const GAMES = [
  { id: "bingo", label: "🎯 Gratitude Bingo", Component: GratitudeBingo },
  { id: "scavenger", label: "🔍 Scavenger Hunt", Component: ScavengerHunt },
];

export default function MindGames() {
  const [active, setActive] = useState("bingo");
  const Active = GAMES.find((g) => g.id === active)?.Component;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🎲 Mind Games</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {GAMES.map((g) => (
          <button key={g.id} onClick={() => setActive(g.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === g.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === g.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === g.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === g.id ? 700 : 500 }}>
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
