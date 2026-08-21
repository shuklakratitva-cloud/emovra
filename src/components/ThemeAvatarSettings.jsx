import { useEffect, useState, useRef } from "react";
import { applyThemeVars } from "../utils/applyTheme.js";
import HSLColorPicker from "./HSLColorPicker.jsx";
import { extractThemeFromImage } from "../utils/extractColors.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function ThemeAvatarSettings({ onProfileUpdate }) {
const { t } = useLanguage();
const [options, setOptions] = useState(null);
const [current, setCurrent] = useState(null);
const [saved, setSaved] = useState(false);

const [uploading, setUploading] = useState(false);
const [uploadError, setUploadError] = useState("");
// FIX: neither fetch below had error handling - if either one failed
// for ANY reason (expired token, network hiccup, server hiccup), this
// component silently rendered nothing, forever, with zero indication
// anything was wrong. This is what "Settings tab disappeared" actually

const [loadError, setLoadError] = useState("");
// FIX: save() used to swallow every failure silently (empty catch, and
// it never checked res.ok). That's the actual cause of "background image

const [saveError, setSaveError] = useState("");
// NEW: data export + account deletion state
const [exporting, setExporting] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteConfirmText, setDeleteConfirmText] = useState("");
const [customBg, setCustomBg] = useState("#0a0a0c");
const [customCard, setCustomCard] = useState("#121214");
const [customAccent, setCustomAccent] = useState("#d4b07a");
const [savingCustom, setSavingCustom] = useState(false);

const [bgPreviewImage, setBgPreviewImage] = useState(null);
const [bgExtracted, setBgExtracted] = useState(null);
const [bgPrompt, setBgPrompt] = useState("");
const [generatingImage, setGeneratingImage] = useState(false);
const [genError, setGenError] = useState("");
const [applyingBg, setApplyingBg] = useState(false);
const bgFileInputRef = useRef(null);
// Live preview - throttled to fire at most once every 120ms (trailing
// edge, so the last value in a rapid burst always wins) rather than on
// every single slider event, which can fire dozens of times per second
// while dragging.
const previewTimer = useRef(null);
useEffect(() => {
return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
}, []);
function previewCustomThrottled(next) {
if (previewTimer.current) clearTimeout(previewTimer.current);
previewTimer.current = setTimeout(() => {
applyThemeVars({
bg: next.bg ?? customBg,
card: next.card ?? customCard,
accent: next.accent ?? customAccent,
text: "#e8dcc6",
backgroundImage: current.backgroundImage,
});
}, 120);
}
const [deleting, setDeleting] = useState(false);

const [feedbackText, setFeedbackText] = useState("");
const [feedbackStatus, setFeedbackStatus] = useState(""); // "", "sending", "sent", "error"

const [fontScale, setFontScale] = useState(() => localStorage.getItem("emovra_font_scale") || "100");
const [highContrast, setHighContrast] = useState(() => localStorage.getItem("emovra_high_contrast") === "true");

useEffect(() => {
document.documentElement.style.setProperty("--emovra-font-scale", `${fontScale}%`);
document.body.style.fontSize = `${fontScale}%`;
}, [fontScale]);

useEffect(() => {
document.body.classList.toggle("emovra-high-contrast", highContrast);
}, [highContrast]);

function changeFontScale(v) {
setFontScale(v);
localStorage.setItem("emovra_font_scale", v);
}
function toggleHighContrast() {
setHighContrast((h) => {
localStorage.setItem("emovra_high_contrast", String(!h));
return !h;
});
}

function logout() {
localStorage.removeItem("token");
localStorage.removeItem("user");
window.location.href = "/";
}

const MOOD_COLORS = {
Happy: "#4ade80", Calm: "#60a5fa", Neutral: "#d4c5a0", Sad: "#818cf8",
Anxious: "#fb923c", Angry: "#f87171", Lonely: "#a78bfa", Overwhelmed: "#f472b6",
"Don't Know What To Do": "#fbbf24", "Everything Fell On You At Once": "#f97316",
};

function moodRingColor() {
try {
const history = JSON.parse(localStorage.getItem("mental_health_mood_history") || "[]");
if (!history.length) return null;
return MOOD_COLORS[history[0].mood] || null;
} catch {
return null;
}
}

const [pushSubscribed, setPushSubscribed] = useState(false);
const [pushLoading, setPushLoading] = useState(false);
const [pushMsg, setPushMsg] = useState("");
const pushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

useEffect(() => {
if (!pushSupported) return;
navigator.serviceWorker.getRegistration().then((reg) => {
reg?.pushManager.getSubscription().then((sub) => setPushSubscribed(!!sub));
});
}, [pushSupported]);

function urlBase64ToUint8Array(base64String) {
const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
const rawData = atob(base64);
return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function enablePush() {
setPushLoading(true);
setPushMsg("");
try {
const permission = await Notification.requestPermission();
if (permission !== "granted") {
setPushMsg(t("themeAvatarSettings.pushBlocked"));
setPushLoading(false);
return;
}
const keyRes = await fetch(`${API}/push/vapid-public-key`);
const keyData = await keyRes.json();
if (!keyData.success) {
setPushMsg(t("themeAvatarSettings.pushNotConfigured"));
setPushLoading(false);
return;
}
const reg = await navigator.serviceWorker.register("/sw.js");
await navigator.serviceWorker.ready;
const sub = await reg.pushManager.subscribe({
userVisibleOnly: true,
applicationServerKey: urlBase64ToUint8Array(keyData.key),
});
await fetch(`${API}/push/subscribe`, { method: "POST", headers: authHeaders(), body: JSON.stringify(sub.toJSON()) });
setPushSubscribed(true);
setPushMsg(t("themeAvatarSettings.pushEnabled"));
} catch (e) {
setPushMsg(t("themeAvatarSettings.pushEnableError"));
}
setPushLoading(false);
}

async function disablePush() {
setPushLoading(true);
try {
const reg = await navigator.serviceWorker.getRegistration();
const sub = await reg?.pushManager.getSubscription();
if (sub) {
await fetch(`${API}/push/unsubscribe`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ endpoint: sub.endpoint }) });
await sub.unsubscribe();
}
setPushSubscribed(false);
setPushMsg(t("themeAvatarSettings.pushDisabled"));
} catch {
setPushMsg(t("themeAvatarSettings.genericError"));
}
setPushLoading(false);
}

async function exportData() {
setExporting(true);
try {
const res = await fetch(`${API}/account/export`, { headers: authHeaders() });
if (!res.ok) throw new Error("export failed");
const data = await res.json();
const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `emovra-my-data-${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
} catch {
alert(t("themeAvatarSettings.exportError"));
}
setExporting(false);
}

async function deleteAccount() {
setDeleting(true);
try {
const res = await fetch(`${API}/account`, { method: "DELETE", headers: authHeaders() });
const data = await res.json();
if (data.success) {
localStorage.removeItem("token");
localStorage.removeItem("user");
window.location.href = "/";
} else {
alert(data.message || t("themeAvatarSettings.deleteAccountFailedDefault"));
setDeleting(false);
}
} catch {
alert(t("themeAvatarSettings.genericError"));
setDeleting(false);
}
}

async function submitFeedback() {
if (!feedbackText.trim()) return;
setFeedbackStatus("sending");
try {
const res = await fetch(`${API}/feedback`, {
method: "POST",
headers: authHeaders(),
body: JSON.stringify({ message: feedbackText, page: "Settings" }),
});
const data = await res.json();
if (data.success) {
setFeedbackStatus("sent");
setFeedbackText("");
setTimeout(() => setFeedbackStatus(""), 3000);
} else {
setFeedbackStatus("error");
}
} catch {
setFeedbackStatus("error");
}
}

function loadProfile() {
setLoadError("");
Promise.all([
fetch(`${API}/profile/options`).then((r) => { if (!r.ok) throw { status: r.status, source: "options" }; return r.json(); }),
fetch(`${API}/profile/me`, { headers: authHeaders() }).then((r) => { if (!r.ok) throw { status: r.status, source: "profile" }; return r.json(); }),
])
.then(([optionsData, profileData]) => {
if (optionsData.success) setOptions(optionsData);
if (profileData.success) {
setCurrent(profileData);

setCustomBg(profileData.customTheme?.bg || profileData.theme?.bg || "#0a0a0c");
setCustomCard(profileData.customTheme?.card || profileData.theme?.card || "#121214");
setCustomAccent(profileData.customTheme?.accent || profileData.theme?.accent || "#d4b07a");
}
if (!optionsData.success || !profileData.success) {
setLoadError(t("themeAvatarSettings.loadSettingsError"));
}
})
.catch((err) => {
if (err?.status === 401 || err?.status === 403) {
setLoadError(t("themeAvatarSettings.sessionExpired"));
} else if (err?.status) {
setLoadError(t("themeAvatarSettings.serverErrorWithStatus", { status: err.status }));
} else {
setLoadError(t("themeAvatarSettings.connectionError"));
}
});
}

useEffect(() => { loadProfile(); }, []);

async function save(update) {
setSaveError("");
try {
const res = await fetch(`${API}/profile/settings`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(update) });

if (!res.ok) {
if (res.status === 413) {
setSaveError(t("themeAvatarSettings.imageTooLargeServer"));
} else if (res.status === 401) {
setSaveError(t("themeAvatarSettings.sessionExpired"));
} else {
setSaveError(t("themeAvatarSettings.saveFailedWithStatus", { status: res.status }));
}
return false;
}
const data = await res.json();
if (data.success) {
setCurrent((c) => ({ ...c, ...data }));
if (data.theme) applyThemeVars(data.theme);
setSaved(true);
setTimeout(() => setSaved(false), 2000);
onProfileUpdate?.();
return true;
}
setSaveError(data.message || t("themeAvatarSettings.saveFailedDefault"));
return false;
} catch {
setSaveError(t("themeAvatarSettings.connectionError"));
return false;
}
}

async function saveCustomTheme() {
setSavingCustom(true);
await save({ customTheme: { bg: customBg, card: customCard, accent: customAccent } });
setSavingCustom(false);
}

function runExtraction(dataUri) {
const img = new Image();
img.onload = () => {
const colors = extractThemeFromImage(img);
setBgExtracted(colors);
};
img.onerror = () => setBgExtracted(null);
img.src = dataUri;
}

function handleBgFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  setGenError("");
  if (file.size > 6 * 1024 * 1024) {
    setGenError(t("themeAvatarSettings.bgImageTooLarge"));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1920;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUri = canvas.toDataURL("image/jpeg", 0.82);
      setBgPreviewImage(dataUri);
      runExtraction(dataUri);
    };
    img.onerror = () => setGenError(t("themeAvatarSettings.bgImageTooLarge"));
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
  
async function generateBgImage() {
if (!bgPrompt.trim() || generatingImage) return;
setGeneratingImage(true);
setGenError("");
try {
const res = await fetch(`${API}/background/generate`, {
method: "POST",
headers: authHeaders(),
body: JSON.stringify({ prompt: bgPrompt.trim() }),
});
const data = await res.json();
if (data.success) {
setBgPreviewImage(data.image);
runExtraction(data.image);
} else {
setGenError(data.message || t("themeAvatarSettings.generateImageFailedDefault"));
}
} catch {
setGenError(t("themeAvatarSettings.genericError"));
}
setGeneratingImage(false);
}

async function applyBgImage() {
if (!bgPreviewImage) return;
setApplyingBg(true);
const payload = { backgroundImage: bgPreviewImage };
if (bgExtracted) {
payload.customTheme = bgExtracted;

setCustomBg(bgExtracted.bg);
setCustomCard(bgExtracted.card);
setCustomAccent(bgExtracted.accent);
}

const ok = await save(payload);
if (ok) {
setBgPreviewImage(null);
setBgExtracted(null);
setBgPrompt("");
}
setApplyingBg(false);
}

function cancelBgPreview() {
setBgPreviewImage(null);
setBgExtracted(null);
setGenError("");
}

const [removingBg, setRemovingBg] = useState(false);
async function removeBgImage() {
setRemovingBg(true);
await save({ removeBackgroundImage: true });
setRemovingBg(false);
}

// NEW: resizes the uploaded image client-side (max 160x160, JPEG) before
// sending it, so we're never uploading a multi-megabyte photo just to
// display it at 60px - keeps the request fast and the database small.
function handleAvatarUpload(e) {
const file = e.target.files?.[0];
if (!file) return;
setUploadError("");

if (file.size > 8 * 1024 * 1024) {
setUploadError(t("themeAvatarSettings.avatarTooLarge"));
return;
}

const reader = new FileReader();
reader.onload = (ev) => {
const img = new Image();
img.onload = () => {
const size = 160;
const canvas = document.createElement("canvas");
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext("2d");

const scale = Math.max(size / img.width, size / img.height);
const w = img.width * scale, h = img.height * scale;
ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

setUploading(true);
save({ avatarImage: dataUrl }).finally(() => setUploading(false));
};
img.onerror = () => setUploadError(t("themeAvatarSettings.avatarReadError"));
img.src = ev.target.result;
};
reader.readAsDataURL(file);
}

if (loadError) {
return (
<div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", marginTop: "20px", textAlign: "center" }}>
<p style={{ fontSize: 13, color: "#f87171" }}>{loadError}</p>
<div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
<button onClick={loadProfile} style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
{t("themeAvatarSettings.tryAgain")}
</button>
<button onClick={logout} style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid #f87171", background: "transparent", color: "#f87171", cursor: "pointer", fontSize: 12 }}>
{t("themeAvatarSettings.logoutButton")}
</button>
</div>
</div>
);
}
if (!options || !current) {
return (
<div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", marginTop: "20px", textAlign: "center" }}>
<p style={{ fontSize: 13, opacity: 0.6 }}>{t("themeAvatarSettings.loadingSettings")}</p>
</div>
);
}

const isCustomActive = current.themePreference === "custom";

return (
<div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
<div>
<h2 style={{ margin: 0 }}>🎨 {t("themeAvatarSettings.heading")}</h2>
<p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{t("themeAvatarSettings.subtitle")}</p>
</div>
<button onClick={logout} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
🚪 {t("themeAvatarSettings.logoutButton")}
</button>
</div>

<div style={{ marginTop: 16 }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("themeAvatarSettings.themeLabel")}</div>
<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
{options.themes.map((th) => (
<button
key={th.id}
onClick={() => { applyThemeVars({ ...th, backgroundImage: current.backgroundImage }); setCustomBg(th.bg); setCustomCard(th.card); setCustomAccent(th.accent); save({ themePreference: th.id }); }}
style={{
display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, cursor: "pointer",
border: !isCustomActive && current.theme?.id === th.id ? "2px solid #d4b07a" : "1px solid var(--border)",
background: "transparent", outline: "none",
}}
>
<span style={{ width: 16, height: 16, borderRadius: "50%", background: th.accent, display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
<span style={{ fontSize: 12, color: "var(--text)" }}>{th.name}</span>
</button>
))}
</div>
</div>

<div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🖌 {t("themeAvatarSettings.customThemeHeading")}</div>
<p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 12px" }}>{t("themeAvatarSettings.customThemeSubtitle")}</p>

<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
<HSLColorPicker label={t("themeAvatarSettings.backgroundColorLabel")} value={customBg} onChange={(hex) => { setCustomBg(hex); previewCustomThrottled({ bg: hex }); }} />
<HSLColorPicker label={t("themeAvatarSettings.cardColorLabel")} value={customCard} onChange={(hex) => { setCustomCard(hex); previewCustomThrottled({ card: hex }); }} />
<HSLColorPicker label={t("themeAvatarSettings.accentColorLabel")} value={customAccent} onChange={(hex) => { setCustomAccent(hex); previewCustomThrottled({ accent: hex }); }} />
</div>

<button onClick={saveCustomTheme} disabled={savingCustom} style={{ marginTop: 14, background: "var(--accent)", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
{savingCustom ? t("themeAvatarSettings.savingCustomTheme") : t("themeAvatarSettings.saveCustomThemeButton")}
</button>
</div>

<div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🖼️ {t("themeAvatarSettings.backgroundImageHeading")}</div>
<p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 12px" }}>{t("themeAvatarSettings.backgroundImageSubtitle")}</p>

{current.backgroundImage && !bgPreviewImage && (
<div style={{ marginBottom: 14 }}>
<img src={current.backgroundImage} alt={t("themeAvatarSettings.currentBackgroundAlt")} style={{ width: "100%", maxWidth: 280, borderRadius: 10, display: "block" }} />
<button onClick={removeBgImage} disabled={removingBg} style={{ marginTop: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 14px", borderRadius: 999, fontSize: 11, cursor: removingBg ? "default" : "pointer", opacity: removingBg ? 0.6 : 1 }}>
{removingBg ? t("themeAvatarSettings.removingBackground") : t("themeAvatarSettings.removeBackgroundImageButton")}
</button>
</div>
)}

{!bgPreviewImage && (
<div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
<div>
<input ref={bgFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBgFileUpload} style={{ display: "none" }} />
<button onClick={() => bgFileInputRef.current?.click()} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 16px", borderRadius: 999, fontSize: 12, cursor: "pointer" }}>
📤 {t("themeAvatarSettings.uploadImageButton")}
</button>
</div>
<div style={{ flex: 1, minWidth: 220 }}>
<div style={{ display: "flex", gap: 8 }}>
<input
value={bgPrompt}
onChange={(e) => setBgPrompt(e.target.value)}
placeholder={t("themeAvatarSettings.bgPromptPlaceholder")}
maxLength={300}
style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)", fontSize: 12 }}
/>
<button onClick={generateBgImage} disabled={!bgPrompt.trim() || generatingImage} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: bgPrompt.trim() ? "pointer" : "not-allowed", opacity: bgPrompt.trim() ? 1 : 0.5, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
{generatingImage && <span style={{ width: 10, height: 10, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "emovra-spin 0.7s linear infinite" }} />}
{generatingImage ? t("themeAvatarSettings.generatingImage") : <>✨ {t("themeAvatarSettings.generateButton")}</>}
</button>
</div>
<p style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{t("themeAvatarSettings.generateNote")}</p>
</div>
</div>
)}

{genError && <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 10 }}>{genError}</p>}

{bgPreviewImage && (
<div>
<img src={bgPreviewImage} alt={t("themeAvatarSettings.previewAlt")} style={{ width: "100%", maxWidth: 320, borderRadius: 10, display: "block" }} />
<div style={{ marginTop: 10 }}>
{bgExtracted ? (
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
<span style={{ fontSize: 11, opacity: 0.6 }}>{t("themeAvatarSettings.matchedColors")}</span>
<span style={{ width: 20, height: 20, borderRadius: 6, background: bgExtracted.bg, borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)" }} title={t("themeAvatarSettings.backgroundColorLabel")} />
<span style={{ width: 20, height: 20, borderRadius: 6, background: bgExtracted.card, borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)" }} title={t("themeAvatarSettings.swatchCardTitle")} />
<span style={{ width: 20, height: 20, borderRadius: 6, background: bgExtracted.accent, borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)" }} title={t("themeAvatarSettings.swatchAccentTitle")} />
</div>
) : (
<p style={{ fontSize: 11, opacity: 0.6 }}>{t("themeAvatarSettings.colorMatchFailed")}</p>
)}
</div>
<div style={{ display: "flex", gap: 10, marginTop: 12 }}>
<button onClick={applyBgImage} disabled={applyingBg} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
{applyingBg ? t("themeAvatarSettings.applyingBackground") : t("themeAvatarSettings.useThisBackgroundButton")}
</button>
<button onClick={cancelBgPreview} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 18px", borderRadius: 999, fontSize: 12, cursor: "pointer" }}>
{t("themeAvatarSettings.cancelButton")}
</button>
</div>
</div>
)}
{saveError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{saveError}</p>}
</div>

<div style={{ marginTop: 20 }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("themeAvatarSettings.avatarLabel")}</div>

<div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
<div style={{ position: "relative", width: 60, height: 60 }}>
<div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `2px solid ${moodRingColor() || "var(--accent)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "var(--card-bg)" }}>
{current.avatarType === "custom" && current.avatarImage
? <img src={current.avatarImage} alt={t("themeAvatarSettings.yourAvatarAlt")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
: (current.avatar || "🦋")}
</div>
{current.avatarAccessory && (
<span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 18, background: "var(--card-bg)", borderRadius: "50%", padding: 2 }}>{current.avatarAccessory}</span>
)}
</div>
<label style={{ fontSize: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 14px", borderRadius: 999, cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}>
{uploading ? t("themeAvatarSettings.uploadingPhoto") : t("themeAvatarSettings.uploadYourPhotoButton")}
<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} disabled={uploading} style={{ display: "none" }} />
</label>
</div>
{uploadError && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 10 }}>{uploadError}</p>}

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{options.avatars.map((a) => (
<button key={a} onClick={() => save({ avatar: a })} style={{ fontSize: 22, width: 44, height: 44, borderRadius: "50%", border: current.avatarType !== "custom" && current.avatar === a ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", cursor: "pointer" }}>
{a}
</button>
))}
</div>

{options.accessories?.length > 0 && (
<div style={{ marginTop: 14 }}>
<div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>{t("themeAvatarSettings.accessoriesHeading")}</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button onClick={() => save({ avatarAccessory: "" })} style={{ fontSize: 11, padding: "8px 12px", borderRadius: 999, border: !current.avatarAccessory ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>
{t("themeAvatarSettings.noneOption")}
</button>
{options.accessories.map((acc) => {
const unlocked = (current.level || 1) >= acc.minLevel;
return (
<button
key={acc.emoji}
onClick={() => unlocked && save({ avatarAccessory: acc.emoji })}
disabled={!unlocked}
title={unlocked ? acc.name : t("themeAvatarSettings.unlocksAtLevel", { level: acc.minLevel })}
style={{ fontSize: 18, padding: "8px 12px", borderRadius: 999, border: current.avatarAccessory === acc.emoji ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.35 }}
>
{acc.emoji} {!unlocked && <span style={{ fontSize: 9 }}>{t("themeAvatarSettings.lockedLevelBadge", { level: acc.minLevel })}</span>}
</button>
);
})}
</div>
</div>
)}
</div>

<div style={{ marginTop: 20 }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("themeAvatarSettings.birthdayHeading")}</div>
<div style={{ display: "flex", gap: 8 }}>
<select defaultValue={current.birthdayMonth || ""} onChange={(e) => save({ birthdayMonth: Number(e.target.value), birthdayDay: current.birthdayDay || 1 })} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
<option value="">{t("themeAvatarSettings.monthPlaceholder")}</option>
{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleString("default", { month: "long" })}</option>)}
</select>
<select defaultValue={current.birthdayDay || ""} onChange={(e) => save({ birthdayDay: Number(e.target.value), birthdayMonth: current.birthdayMonth || 1 })} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
<option value="">{t("themeAvatarSettings.dayPlaceholder")}</option>
{Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
</select>
</div>
</div>

{saved && <p style={{ fontSize: 12, color: "#4ade80", marginTop: 12 }}>{t("themeAvatarSettings.saved")} ✓</p>}

{pushSupported && (
<div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("themeAvatarSettings.notificationsHeading")}</div>
<p style={{ fontSize: 11, opacity: 0.6, marginBottom: 10 }}>{t("themeAvatarSettings.notificationsSubtitle")}</p>
<button
onClick={pushSubscribed ? disablePush : enablePush}
disabled={pushLoading}
style={{ padding: "8px 18px", borderRadius: 999, border: pushSubscribed ? "1px solid var(--border)" : "none", background: pushSubscribed ? "transparent" : "var(--accent)", color: pushSubscribed ? "var(--text)" : "#000", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
>
{pushLoading ? t("themeAvatarSettings.pushWorking") : pushSubscribed ? t("themeAvatarSettings.turnOffNotificationsButton") : t("themeAvatarSettings.enableDailyReminderButton")}
</button>
{pushMsg && <p style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>{pushMsg}</p>}
</div>
)}

<div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t("themeAvatarSettings.accessibilityHeading")}</div>
<div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>{t("themeAvatarSettings.textSizeLabel")}</div>
<div style={{ display: "flex", gap: 8 }}>
{[{ v: "90", l: t("themeAvatarSettings.fontSizeSmall") }, { v: "100", l: t("themeAvatarSettings.fontSizeDefault") }, { v: "115", l: t("themeAvatarSettings.fontSizeLarge") }, { v: "130", l: t("themeAvatarSettings.fontSizeExtraLarge") }].map((opt) => (
<button
key={opt.v}
onClick={() => changeFontScale(opt.v)}
style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: fontScale === opt.v ? "2px solid var(--accent)" : "1px solid var(--border)", background: fontScale === opt.v ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}
>
{opt.l}
</button>
))}
</div>
<div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
<button
onClick={toggleHighContrast}
style={{ padding: "8px 16px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: highContrast ? "2px solid var(--accent)" : "1px solid var(--border)", background: highContrast ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}
>
{highContrast ? <>✓ {t("themeAvatarSettings.highContrastOn")}</> : t("themeAvatarSettings.highContrastMode")}
</button>
</div>
</div>

<div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t("themeAvatarSettings.yourDataHeading")}</div>
<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
<button onClick={exportData} disabled={exporting} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
{exporting ? t("themeAvatarSettings.preparingExport") : <>⬇ {t("themeAvatarSettings.exportMyDataButton")}</>}
</button>
<button onClick={() => setShowDeleteConfirm(true)} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #f87171", background: "transparent", color: "#f87171", cursor: "pointer", fontSize: 12 }}>
{t("themeAvatarSettings.deleteMyAccountButton")}
</button>
</div>

{showDeleteConfirm && (
<div style={{ marginTop: 14, padding: 16, borderRadius: 12, border: "1px solid #f87171", background: "rgba(248,113,113,0.06)" }}>
<p style={{ fontSize: 13, margin: "0 0 10px" }}>
{t("themeAvatarSettings.deleteWarningIntro")} <b>{t("themeAvatarSettings.deleteWarningUndone")}</b> {t("themeAvatarSettings.deleteWarningType", { word: "DELETE" })}
</p>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={t("themeAvatarSettings.deleteConfirmPlaceholder", { word: "DELETE" })} style={{ flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
<button
onClick={deleteAccount}
disabled={deleteConfirmText !== "DELETE" || deleting}
style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: deleteConfirmText === "DELETE" ? "#dc2626" : "#555", color: "#fff", fontWeight: 700, cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed", fontSize: 12 }}
>
{deleting ? t("themeAvatarSettings.deletingButton") : t("themeAvatarSettings.permanentlyDeleteButton")}
</button>
<button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>
{t("themeAvatarSettings.cancelButton")}
</button>
</div>
</div>
)}
</div>

<div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>💬 {t("themeAvatarSettings.feedbackHeading")}</div>
<p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 10px" }}>{t("themeAvatarSettings.feedbackSubtitle")}</p>
<textarea
value={feedbackText}
onChange={(e) => setFeedbackText(e.target.value)}
placeholder={t("themeAvatarSettings.feedbackPlaceholder")}
rows={3}
style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)", fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
/>
<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
<button
onClick={submitFeedback}
disabled={!feedbackText.trim() || feedbackStatus === "sending"}
style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, fontSize: 12, cursor: feedbackText.trim() ? "pointer" : "not-allowed", opacity: feedbackText.trim() ? 1 : 0.5 }}
>
{feedbackStatus === "sending" ? t("themeAvatarSettings.sendingFeedback") : t("themeAvatarSettings.sendFeedbackButton")}
</button>
{feedbackStatus === "sent" && <span style={{ fontSize: 12, color: "#4ade80" }}>✓ {t("themeAvatarSettings.feedbackSent")}</span>}
{feedbackStatus === "error" && <span style={{ fontSize: 12, color: "#f87171" }}>{t("themeAvatarSettings.feedbackError")}</span>}
</div>
</div>
</div>
);
}
