// src/utils/applyTheme.js
// This is the piece that was missing: ThemeAvatarSettings.jsx lets someone
// PICK a theme and saves it to the backend, but nothing was actually
// reading that saved value and changing what renders. This does that part.

const API = "https://emovra.onrender.com/api";

const DEFAULT_THEME = {
  id: "classic-black-gold",
  bg: "#0a0a0c",
  card: "rgba(18,18,20,0.95)",
  accent: "#d4b07a",
  text: "#e8dcc6",
};

export function applyThemeVars(theme) {
  const t = theme || DEFAULT_THEME;
  const root = document.documentElement;
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--card-bg", t.card);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--text", t.text);
  root.style.setProperty("--text-h", t.accent); // NEW: heading/label accent color follows the theme's accent too
  document.body.style.background = t.bg;
}

// Call once on app load. Applies the default (Classic Black & Gold)
// immediately so there's never a flash of unstyled content, then swaps in
// the person's actual saved preference once it's fetched, if they're
// logged in and picked something else.
export async function initTheme() {
  applyThemeVars(DEFAULT_THEME);

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && data.theme) applyThemeVars(data.theme);
  } catch {
    // stay on default - never block the app over a theme fetch failing
  }
}
