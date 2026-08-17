import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// ============================================================
// Gratitude Bingo - check off prompts, aim for a full row
// ============================================================
function GratitudeBingo() {
  const { t } = useLanguage();
  const PROMPT_KEYS = ["mindGames.prompt0", "mindGames.prompt1", "mindGames.prompt2", "mindGames.prompt3", "mindGames.prompt4", "mindGames.prompt5", "mindGames.prompt6", "mindGames.prompt7", "mindGames.prompt8"];
  const [checked, setChecked] = useState(() => new Array(9).fill(false));
  function toggle(i) { setChecked((c) => { const n = [...c]; n[i] = !n[i]; return n; }); }
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("mindGames.bingoInstructions")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 10 }}>
        {PROMPT_KEYS.map((key, i) => (
          <button key={i} onClick={() => toggle(i)} style={{ padding: 10, borderRadius: 8, fontSize: 11, minHeight: 70, cursor: "pointer", border: checked[i] ? "1px solid var(--accent)" : "1px solid var(--border)", background: checked[i] ? "rgba(212,176,122,0.2)" : "transparent", color: "var(--text)" }}>
            {t(key)}
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
  const { t } = useLanguage();
  const ITEM_KEYS = ["mindGames.item0", "mindGames.item1", "mindGames.item2", "mindGames.item3", "mindGames.item4", "mindGames.item5", "mindGames.item6", "mindGames.item7"];
  const [found, setFound] = useState(() => new Array(8).fill(false));
  function toggle(i) { setFound((f) => { const n = [...f]; n[i] = !n[i]; return n; }); }
  const count = found.filter(Boolean).length;
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("mindGames.scavengerCount", { count, total: ITEM_KEYS.length })}</p>
      {ITEM_KEYS.map((key, i) => (
        <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid var(--accent)", background: found[i] ? "var(--accent)" : "transparent" }} />
          <span style={{ fontSize: 13, opacity: found[i] ? 0.5 : 1, textDecoration: found[i] ? "line-through" : "none" }}>{t(key)}</span>
        </div>
      ))}
    </div>
  );
}

const GAMES = [
  { id: "bingo", emoji: "🎯", labelKey: "mindGames.gratitudeBingoLabel", Component: GratitudeBingo },
  { id: "scavenger", emoji: "🔍", labelKey: "mindGames.scavengerHuntLabel", Component: ScavengerHunt },
];

export default function MindGames() {
  const [active, setActive] = useState("bingo");
  const { t } = useLanguage();
  const Active = GAMES.find((g) => g.id === active)?.Component;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🎲 {t("mindGames.title")}</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {GAMES.map((g) => (
          <button key={g.id} onClick={() => setActive(g.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === g.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === g.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === g.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === g.id ? 700 : 500 }}>
            {g.emoji} {t(g.labelKey)}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
