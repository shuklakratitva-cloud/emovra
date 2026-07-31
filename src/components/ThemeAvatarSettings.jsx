import { useEffect, useState } from "react";
import { applyThemeVars } from "../utils/applyTheme.js";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function ThemeAvatarSettings() {
  const [options, setOptions] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saved, setSaved] = useState(false);
  // NEW: local color-picker state, seeded from the saved custom theme (or
  // sensible defaults) so the pickers show something reasonable even
  // before the person has ever customized anything.
  const [customBg, setCustomBg] = useState("#0a0a0c");
  const [customCard, setCustomCard] = useState("#121214");
  const [customAccent, setCustomAccent] = useState("#d4b07a");

  useEffect(() => {
    fetch(`${API}/profile/options`).then((r) => r.json()).then((d) => { if (d.success) setOptions(d); });
    fetch(`${API}/profile/me`, { headers: authHeaders() }).then((r) => r.json()).then((d) => {
      if (d.success) {
        setCurrent(d);
        if (d.customTheme?.bg) setCustomBg(d.customTheme.bg);
        if (d.customTheme?.card) setCustomCard(d.customTheme.card);
        if (d.customTheme?.accent) setCustomAccent(d.customTheme.accent);
      }
    });
  }, []);

  async function save(update) {
    try {
      const res = await fetch(`${API}/profile/settings`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(update) });
      const data = await res.json();
      if (data.success) {
        setCurrent((c) => ({ ...c, ...data }));
        if (data.theme) applyThemeVars(data.theme); // instant visual feedback, not just saved silently
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
  }

  // NEW: live-preview the custom colors as you drag the picker, WITHOUT
  // saving on every single change (color inputs fire constantly while
  // dragging) - only actually saves when you click "Save custom theme".
  function previewCustom(next) {
    applyThemeVars({
      bg: next.bg ?? customBg,
      card: next.card ?? customCard,
      accent: next.accent ?? customAccent,
      text: "#e8dcc6",
    });
  }

  function saveCustomTheme() {
    save({ customTheme: { bg: customBg, card: customCard, accent: customAccent } });
  }

  if (!options || !current) return null;

  const isCustomActive = current.themePreference === "custom";

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🎨 Personalize</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Classic Black &amp; Gold is the default - these are optional.</p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Theme</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {options.themes.map((t) => (
            <button
              key={t.id}
              onClick={() => save({ themePreference: t.id })}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, cursor: "pointer",
                border: !isCustomActive && current.theme?.id === t.id ? "2px solid #d4b07a" : "1px solid var(--border)",
                background: t.bg,
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.accent, display: "inline-block" }} />
              <span style={{ fontSize: 12, color: t.text }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NEW: custom color picker - pick your own background/box/accent colors */}
      <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: isCustomActive ? "2px solid #d4b07a" : "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🖌 Or make your own</div>
        <p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 12px" }}>Pick your own background and box colors. Preview updates live - click Save to keep it.</p>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
            Background
            <input type="color" value={customBg} onChange={(e) => { setCustomBg(e.target.value); previewCustom({ bg: e.target.value }); }} style={{ width: 50, height: 34, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
            Box / Card color
            <input type="color" value={customCard} onChange={(e) => { setCustomCard(e.target.value); previewCustom({ card: e.target.value }); }} style={{ width: 50, height: 34, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
            Accent color
            <input type="color" value={customAccent} onChange={(e) => { setCustomAccent(e.target.value); previewCustom({ accent: e.target.value }); }} style={{ width: 50, height: 34, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
          </label>
        </div>

        <button onClick={saveCustomTheme} style={{ marginTop: 14, background: "var(--accent)", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          Save custom theme
        </button>
        {!isCustomActive && (
          <p style={{ fontSize: 10, opacity: 0.5, marginTop: 8 }}>Saving will switch your active theme to this custom one.</p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Avatar</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {options.avatars.map((a) => (
            <button key={a} onClick={() => save({ avatar: a })} style={{ fontSize: 22, width: 44, height: 44, borderRadius: "50%", border: current.avatar === a ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", cursor: "pointer" }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Birthday (month/day only - we don't need the year)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select defaultValue={current.birthdayMonth || ""} onChange={(e) => save({ birthdayMonth: Number(e.target.value), birthdayDay: current.birthdayDay || 1 })} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleString("default", { month: "long" })}</option>)}
          </select>
          <select defaultValue={current.birthdayDay || ""} onChange={(e) => save({ birthdayDay: Number(e.target.value), birthdayMonth: current.birthdayMonth || 1 })} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
      </div>

      {saved && <p style={{ fontSize: 12, color: "#4ade80", marginTop: 12 }}>Saved ✓</p>}
    </div>
  );
}
