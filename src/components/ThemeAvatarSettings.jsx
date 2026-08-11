import { useEffect, useState, useRef } from "react";
import { applyThemeVars } from "../utils/applyTheme.js";
import HSLColorPicker from "./HSLColorPicker.jsx";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function ThemeAvatarSettings() {
  const [options, setOptions] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saved, setSaved] = useState(false);
  // NEW: avatar upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // FIX: neither fetch below had error handling - if either one failed
  // for ANY reason (expired token, network hiccup, server hiccup), this
  // component silently rendered nothing, forever, with zero indication
  // anything was wrong. This is what "Settings tab disappeared" actually
  // was. Now shows a real error state with a retry button instead.
  const [loadError, setLoadError] = useState("");
  // NEW: data export + account deletion state
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [customBg, setCustomBg] = useState("#0a0a0c");
  const [customCard, setCustomCard] = useState("#121214");
  const [customAccent, setCustomAccent] = useState("#d4b07a");
  const [savingCustom, setSavingCustom] = useState(false);
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
      });
    }, 120);
  }
  const [deleting, setDeleting] = useState(false);
  // NEW: in-app feedback/bug reporting state
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState(""); // "", "sending", "sent", "error"
  // NEW: accessibility settings - font size + high contrast, applied
  // immediately via CSS custom property + a body class, saved locally
  // (device preference, doesn't need backend sync)
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

  const MOOD_COLORS = {
    Happy: "#4ade80", Calm: "#60a5fa", Neutral: "#d4c5a0", Sad: "#818cf8",
    Anxious: "#fb923c", Angry: "#f87171", Lonely: "#a78bfa", Overwhelmed: "#f472b6",
    "Don't Know What To Do": "#fbbf24", "Everything Fell On You At Once": "#f97316",
  };

  // NEW: mood-themed avatar - the avatar's ring color reflects your most
  // recently logged mood, reusing the same MOOD_COLORS map as the mood
  // wallpaper feature above
  function moodRingColor() {
    try {
      const history = JSON.parse(localStorage.getItem("mental_health_mood_history") || "[]");
      if (!history.length) return null;
      return MOOD_COLORS[history[0].mood] || null;
    } catch {
      return null;
    }
  }

  // NEW: push notifications
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
        setPushMsg("Notifications were blocked - you can re-enable them in your browser's site settings.");
        setPushLoading(false);
        return;
      }
      const keyRes = await fetch(`${API}/push/vapid-public-key`);
      const keyData = await keyRes.json();
      if (!keyData.success) {
        setPushMsg("Push notifications aren't set up on the server yet.");
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
      setPushMsg("Notifications enabled.");
    } catch (e) {
      setPushMsg("Couldn't enable notifications - try again.");
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
      setPushMsg("Notifications turned off.");
    } catch {
      setPushMsg("Something went wrong - try again.");
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
      alert("Couldn't export your data - try again in a moment.");
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
        alert(data.message || "Could not delete account.");
        setDeleting(false);
      }
    } catch {
      alert("Something went wrong - try again.");
      setDeleting(false);
    }
  }

  // NEW: in-app feedback/bug reporting - sends straight to the developer's
  // email via the backend, so there's a real way to flag something beyond
  // a screenshot or catching it directly.
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
          if (profileData.customTheme?.bg) setCustomBg(profileData.customTheme.bg);
          if (profileData.customTheme?.card) setCustomCard(profileData.customTheme.card);
          if (profileData.customTheme?.accent) setCustomAccent(profileData.customTheme.accent);
        }
        if (!optionsData.success || !profileData.success) {
          setLoadError("Couldn't load your settings - try again.");
        }
      })
      .catch((err) => {
        if (err?.status === 401 || err?.status === 403) {
          setLoadError("Your session has expired - please log out and log back in.");
        } else if (err?.status) {
          setLoadError(`Server error (${err.status}) - try again in a moment.`);
        } else {
          setLoadError("Couldn't reach the server - check your connection and try again.");
        }
      });
  }

  useEffect(() => { loadProfile(); }, []);

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

  // Only called once, on Save - not on every slider drag. Matches the
  // exact same pattern preset themes already use reliably.
  async function saveCustomTheme() {
    setSavingCustom(true);
    await save({ customTheme: { bg: customBg, card: customCard, accent: customAccent } });
    setSavingCustom(false);
  }

  // NEW: resizes the uploaded image client-side (max 160x160, JPEG) before
  // sending it, so we're never uploading a multi-megabyte photo just to
  // display it at 60px - keeps the request fast and the database small.
  function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image too large - please pick something under 8MB.");
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
        // cover-crop to a square so the avatar isn't stretched
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        setUploading(true);
        save({ avatarImage: dataUrl }).finally(() => setUploading(false));
      };
      img.onerror = () => setUploadError("Couldn't read that image - try a different file.");
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (loadError) {
    return (
      <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", marginTop: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#f87171" }}>{loadError}</p>
        <button onClick={loadProfile} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
          Try again
        </button>
      </div>
    );
  }
  if (!options || !current) {
    return (
      <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", marginTop: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, opacity: 0.6 }}>Loading settings...</p>
      </div>
    );
  }

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
                background: "transparent",
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.accent, display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 12, color: "var(--text)" }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🖌 Or make your own</div>
        <p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 12px" }}>Pick your own colors below - the app previews live as you go. Click Save to keep it.</p>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <HSLColorPicker label="Background" value={customBg} onChange={(hex) => { setCustomBg(hex); previewCustomThrottled({ bg: hex }); }} />
          <HSLColorPicker label="Box / Card color" value={customCard} onChange={(hex) => { setCustomCard(hex); previewCustomThrottled({ card: hex }); }} />
          <HSLColorPicker label="Accent color" value={customAccent} onChange={(hex) => { setCustomAccent(hex); previewCustomThrottled({ accent: hex }); }} />
        </div>

        <button onClick={saveCustomTheme} disabled={savingCustom} style={{ marginTop: 14, background: "var(--accent)", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          {savingCustom ? "Saving..." : "Save custom theme"}
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Avatar</div>

        {/* NEW: current avatar preview, shows either the uploaded image or the emoji */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 60, height: 60 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `2px solid ${moodRingColor() || "var(--accent)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "var(--card-bg)" }}>
              {current.avatarType === "custom" && current.avatarImage
                ? <img src={current.avatarImage} alt="Your avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (current.avatar || "🦋")}
            </div>
            {current.avatarAccessory && (
              <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 18, background: "var(--card-bg)", borderRadius: "50%", padding: 2 }}>{current.avatarAccessory}</span>
            )}
          </div>
          <label style={{ fontSize: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 14px", borderRadius: 999, cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "Uploading..." : "Upload your own photo"}
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

        {/* NEW: avatar accessories - unlockable by level */}
        {options.accessories?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Accessories (unlock by leveling up)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => save({ avatarAccessory: "" })} style={{ fontSize: 11, padding: "8px 12px", borderRadius: 999, border: !current.avatarAccessory ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>
                None
              </button>
              {options.accessories.map((acc) => {
                const unlocked = (current.level || 1) >= acc.minLevel;
                return (
                  <button
                    key={acc.emoji}
                    onClick={() => unlocked && save({ avatarAccessory: acc.emoji })}
                    disabled={!unlocked}
                    title={unlocked ? acc.name : `Unlocks at level ${acc.minLevel}`}
                    style={{ fontSize: 18, padding: "8px 12px", borderRadius: 999, border: current.avatarAccessory === acc.emoji ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.35 }}
                  >
                    {acc.emoji} {!unlocked && <span style={{ fontSize: 9 }}>🔒Lv{acc.minLevel}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

      {/* NEW: push notifications toggle */}
      {pushSupported && (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Notifications</div>
          <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 10 }}>A gentle daily nudge to check in, only if you haven't already that day.</p>
          <button
            onClick={pushSubscribed ? disablePush : enablePush}
            disabled={pushLoading}
            style={{ padding: "8px 18px", borderRadius: 999, border: pushSubscribed ? "1px solid var(--border)" : "none", background: pushSubscribed ? "transparent" : "var(--accent)", color: pushSubscribed ? "var(--text)" : "#000", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
          >
            {pushLoading ? "Working..." : pushSubscribed ? "Turn off notifications" : "Enable daily reminder"}
          </button>
          {pushMsg && <p style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>{pushMsg}</p>}
        </div>
      )}

      {/* NEW: accessibility - font size + high contrast */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Accessibility</div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Text size</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: "90", l: "Small" }, { v: "100", l: "Default" }, { v: "115", l: "Large" }, { v: "130", l: "Extra Large" }].map((opt) => (
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
            {highContrast ? "✓ High contrast on" : "High contrast mode"}
          </button>
        </div>
      </div>

      {/* NEW: self-serve data export + account deletion - actually
          delivers on what the Privacy Policy promises, instead of leaving
          it as a manual email-me process */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Your Data</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={exportData} disabled={exporting} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
            {exporting ? "Preparing..." : "⬇ Export my data"}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #f87171", background: "transparent", color: "#f87171", cursor: "pointer", fontSize: 12 }}>
            Delete my account
          </button>
        </div>

        {showDeleteConfirm && (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 12, border: "1px solid #f87171", background: "rgba(248,113,113,0.06)" }}>
            <p style={{ fontSize: 13, margin: "0 0 10px" }}>
              This permanently deletes your account, journal, check-in history, habits, goals, and everything else. <b>This can't be undone.</b> Type <b>DELETE</b> to confirm.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" style={{ flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: deleteConfirmText === "DELETE" ? "#dc2626" : "#555", color: "#fff", fontWeight: 700, cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed", fontSize: 12 }}
              >
                {deleting ? "Deleting..." : "Permanently delete"}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW: in-app feedback/bug reporting */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>💬 Feedback or found a bug?</div>
        <p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 10px" }}>Tell us what's wrong or what you'd like to see - it goes straight to the developer.</p>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)", fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <button
            onClick={submitFeedback}
            disabled={!feedbackText.trim() || feedbackStatus === "sending"}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, fontSize: 12, cursor: feedbackText.trim() ? "pointer" : "not-allowed", opacity: feedbackText.trim() ? 1 : 0.5 }}
          >
            {feedbackStatus === "sending" ? "Sending..." : "Send feedback"}
          </button>
          {feedbackStatus === "sent" && <span style={{ fontSize: 12, color: "#4ade80" }}>✓ Thanks - sent!</span>}
          {feedbackStatus === "error" && <span style={{ fontSize: 12, color: "#f87171" }}>Couldn't send - try again.</span>}
        </div>
      </div>
    </div>
  );
}
