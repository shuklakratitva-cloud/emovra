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
  root.style.setProperty("--text-h", t.accent); 
  document.body.style.setProperty("background", t.bg, "important");
  document.documentElement.style.setProperty("background", t.bg, "important");
if (t.backgroundImage) {
  const overlay = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))`;
  const bgImageValue = `${overlay}, url(${t.backgroundImage})`;
  root.style.setProperty("--bg-image", bgImageValue);
  document.body.style.setProperty("background-image", bgImageValue, "important");
  document.body.style.setProperty("background-size", "cover", "important");
  document.body.style.setProperty("background-position", "center", "important");
  document.body.style.setProperty("background-attachment", "fixed", "important");
} else {
  root.style.setProperty("--bg-image", "none");
  document.body.style.removeProperty("background-image");
  document.body.style.removeProperty("background-size");
  document.body.style.removeProperty("background-position");
  document.body.style.removeProperty("background-attachment");
}
}
export async function initTheme() {
  applyThemeVars(DEFAULT_THEME);
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && data.theme) applyThemeVars(data.theme);
  } catch {
     }
}
