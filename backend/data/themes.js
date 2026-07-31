// backend/data/themes.js - opt-in alternate palettes. "classic-black-gold"
// is and stays the default for every account - these are additive options
// a person can switch TO, never a replacement for the default.
export const THEMES = {
  "classic-black-gold": { id: "classic-black-gold", name: "Classic Black & Gold", bg: "#0a0a0c", card: "rgba(18,18,20,0.95)", accent: "#d4b07a", text: "#e8dcc6" },
  "midnight-violet":    { id: "midnight-violet",    name: "Midnight Violet",      bg: "#0d0a14", card: "rgba(24,18,32,0.95)", accent: "#a78bfa", text: "#e8dcf0" },
  "forest-calm":        { id: "forest-calm",        name: "Forest Calm",          bg: "#0a120e", card: "rgba(16,28,20,0.95)", accent: "#86efac", text: "#dcf5e0" },
  "rose-quartz":        { id: "rose-quartz",        name: "Rose Quartz",          bg: "#140a0e", card: "rgba(30,16,22,0.95)", accent: "#f9a8d4", text: "#f5dce8" },
};

export const AVATARS = ["🦋","🌸","🌊","🌙","⭐","🌻","🦊","🐢","🐝","🍃","🔥","🌈"];

// Shared theme resolution - used by both routes/profile.js and
// routes/dashboard.js so a custom theme shows up consistently everywhere,
// not just on the settings screen.
function readableTextFor(hexBg) {
  try {
    const r = parseInt(hexBg.slice(1, 3), 16);
    const g = parseInt(hexBg.slice(3, 5), 16);
    const b = parseInt(hexBg.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? "#1a1a1a" : "#e8dcc6";
  } catch {
    return "#e8dcc6";
  }
}

export function resolveTheme(user) {
  if (user?.themePreference === "custom" && user?.customTheme?.bg) {
    return {
      id: "custom",
      name: "Custom",
      bg: user.customTheme.bg,
      card: user.customTheme.card || user.customTheme.bg,
      accent: user.customTheme.accent || "#d4b07a",
      text: readableTextFor(user.customTheme.bg),
    };
  }
  return THEMES[user?.themePreference] || THEMES["classic-black-gold"];
}
