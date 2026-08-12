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
  // FIX: was `document.body.style.background = t.bg` - a plain inline
  // style, which can still lose to a stylesheet rule using !important
  // (inline styles only automatically win when there's no !important
  // competing with them). Forced with maximum priority instead, so this
  // can never be silently overridden by anything else in the cascade.
  document.body.style.setProperty("background", t.bg, "important");
  document.documentElement.style.setProperty("background", t.bg, "important");

  // NEW: optional background image (uploaded or AI-generated). A dark
  // overlay gradient sits between the image and the content so text
  // stays readable regardless of what the image looks like - the image
  // itself is decorative, not something the UI depends on for contrast.
  if (t.backgroundImage) {
    const overlay = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))`;
    document.body.style.setProperty("background-image", `${overlay}, url(${t.backgroundImage})`, "important");
    document.body.style.setProperty("background-size", "cover", "important");
    document.body.style.setProperty("background-position", "center", "important");
    document.body.style.setProperty("background-attachment", "fixed", "important");
  } else {
    document.body.style.removeProperty("background-image");
    document.body.style.removeProperty("background-size");
    document.body.style.removeProperty("background-position");
    document.body.style.removeProperty("background-attachment");
  }
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
