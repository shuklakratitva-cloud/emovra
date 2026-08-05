// backend/data/themes.js - opt-in alternate palettes. "classic-black-gold"
// is and stays the default for every account - these are additive options
// a person can switch TO, never a replacement for the default.
export const THEMES = {
  "classic-black-gold": { id: "classic-black-gold", name: "Classic Black & Gold", bg: "#0a0a0c", card: "rgba(18,18,20,0.95)", accent: "#d4b07a", text: "#e8dcc6" },
  "midnight-violet":    { id: "midnight-violet",    name: "Midnight Violet",      bg: "#0d0a14", card: "rgba(24,18,32,0.95)", accent: "#a78bfa", text: "#e8dcf0" },
  "forest-calm":        { id: "forest-calm",        name: "Forest Calm",          bg: "#0a120e", card: "rgba(16,28,20,0.95)", accent: "#86efac", text: "#dcf5e0" },
  "rose-quartz":        { id: "rose-quartz",        name: "Rose Quartz",          bg: "#140a0e", card: "rgba(30,16,22,0.95)", accent: "#f9a8d4", text: "#f5dce8" },
  // NEW: 4 more presets, added to replace the custom color picker (removed
  // after it caused persistent, hard-to-pin-down rendering bugs) - these
  // are fixed, pre-tested hex values, so there's no live color math and no
  // possible slider/state bug, just genuine extra variety.
  "ocean-teal":         { id: "ocean-teal",         name: "Ocean Teal",           bg: "#081414", card: "rgba(14,28,28,0.95)", accent: "#5eead4", text: "#dcf5f2" },
  "sunset-amber":       { id: "sunset-amber",        name: "Sunset Amber",        bg: "#160e08", card: "rgba(32,20,14,0.95)", accent: "#fb923c", text: "#f5e4d8" },
  "slate-blue":         { id: "slate-blue",         name: "Slate Blue",           bg: "#0a0e16", card: "rgba(18,24,34,0.95)", accent: "#60a5fa", text: "#dce6f5" },
  "cherry-blossom":     { id: "cherry-blossom",     name: "Cherry Blossom",       bg: "#140a10", card: "rgba(30,16,24,0.95)", accent: "#fb7185", text: "#f5dce4" },
  // NEW: light themes - every preset up to this point was dark. Text
  // color is flipped to a dark tone for readability against the light
  // backgrounds. Honest note: some individual UI elements elsewhere in
  // the app use hardcoded overlay colors designed with dark backgrounds
  // in mind (e.g. "rgba(255,255,255,0.1)" style highlights) - those will
  // still render, just not quite as polished in light mode as the core
  // background/card/accent/text sweep is. Kept to 3 rather than matching
  // the dark set 1-for-1, since this is a newer addition, not the
  // primary experience the rest of the app was built around.
  "soft-ivory":  { id: "soft-ivory",  name: "Soft Ivory",  bg: "#faf7f0", card: "rgba(255,255,255,0.9)",  accent: "#c98a2e", text: "#3a3226" },
  "sky-mist":    { id: "sky-mist",    name: "Sky Mist",    bg: "#f2f6fa", card: "rgba(255,255,255,0.9)",  accent: "#3b82f6", text: "#22303f" },
  "sage-light":  { id: "sage-light",  name: "Sage Light",  bg: "#f4f8f2", card: "rgba(255,255,255,0.9)",  accent: "#4d8c5c", text: "#26332a" },
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
