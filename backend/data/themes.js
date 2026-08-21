export const THEMES = {
  "classic-black-gold": { id: "classic-black-gold", name: "Classic Black & Gold", bg: "#0a0a0c", card: "rgba(18,18,20,0.95)", accent: "#d4b07a", text: "#e8dcc6" },

  "midnight-violet":    { id: "midnight-violet",    name: "Midnight Violet",      bg: "#1d1430", card: "rgba(38,26,58,0.95)", accent: "#a78bfa", text: "#e8dcf0" },
  "forest-calm":        { id: "forest-calm",        name: "Forest Calm",          bg: "#132a1c", card: "rgba(22,46,30,0.95)", accent: "#86efac", text: "#dcf5e0" },
  "rose-quartz":        { id: "rose-quartz",        name: "Rose Quartz",          bg: "#2a1420", card: "rgba(46,22,36,0.95)", accent: "#f9a8d4", text: "#f5dce8" },

  "ocean-teal":         { id: "ocean-teal",         name: "Ocean Teal",           bg: "#0f2c2c", card: "rgba(20,46,46,0.95)", accent: "#5eead4", text: "#dcf5f2" },
  "sunset-amber":       { id: "sunset-amber",        name: "Sunset Amber",        bg: "#2e1c10", card: "rgba(48,32,20,0.95)", accent: "#fb923c", text: "#f5e4d8" },
  "slate-blue":         { id: "slate-blue",         name: "Slate Blue",           bg: "#152036", card: "rgba(26,38,58,0.95)", accent: "#60a5fa", text: "#dce6f5" },
  "cherry-blossom":     { id: "cherry-blossom",     name: "Cherry Blossom",       bg: "#2a1622", card: "rgba(46,24,38,0.95)", accent: "#fb7185", text: "#f5dce4" },

  "coral-reef":  { id: "coral-reef",  name: "Coral Reef",  bg: "#2e1712", card: "rgba(48,28,22,0.95)", accent: "#fb7156", text: "#f5ded8" },
  "emerald":     { id: "emerald",     name: "Emerald",     bg: "#0f2a1e", card: "rgba(20,46,36,0.95)", accent: "#34d399", text: "#dcf5ea" },
  "ice-blue":    { id: "ice-blue",    name: "Ice Blue",    bg: "#132430", card: "rgba(24,42,54,0.95)", accent: "#7dd3fc", text: "#e0f2fe" },
  "berry":       { id: "berry",       name: "Berry",       bg: "#26102e", card: "rgba(44,20,50,0.95)", accent: "#e879f9", text: "#f5dcf8" },
  "warm-earth":  { id: "warm-earth",  name: "Warm Earth",  bg: "#241a10", card: "rgba(42,32,20,0.95)", accent: "#d4a574", text: "#f0e4d4" },

  "soft-ivory":  { id: "soft-ivory",  name: "Soft Ivory",  bg: "#faf7f0", card: "rgba(255,255,255,0.9)",  accent: "#c98a2e", text: "#3a3226" },
  "sky-mist":    { id: "sky-mist",    name: "Sky Mist",    bg: "#f2f6fa", card: "rgba(255,255,255,0.9)",  accent: "#3b82f6", text: "#22303f" },
  "sage-light":  { id: "sage-light",  name: "Sage Light",  bg: "#f4f8f2", card: "rgba(255,255,255,0.9)",  accent: "#4d8c5c", text: "#26332a" },
};

export const AVATARS = ["🦋","🌸","🌊","🌙","⭐","🌻","🦊","🐢","🐝","🍃","🔥","🌈"];

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
  const bgImage = user?.backgroundImage || "";
  if (user?.themePreference === "custom" && user?.customTheme?.bg) {
    return {
      id: "custom",
      name: "Custom",
      bg: user.customTheme.bg,
      card: user.customTheme.card || user.customTheme.bg,
      accent: user.customTheme.accent || "#d4b07a",
      text: readableTextFor(user.customTheme.bg),
      backgroundImage: bgImage,
    };
  }
  if (user?.themePreference && THEMES[user.themePreference]) {
    return { ...THEMES[user.themePreference], backgroundImage: bgImage };
  }
  return { ...THEMES["classic-black-gold"], backgroundImage: bgImage };
}
