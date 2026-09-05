import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function ScheduledLetters() {
  const [letters, setLetters] = useState([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState(""); // NEW - only filters delivered (readable) letters; locked ones always show since there's no text to search yet
  const { t } = useLanguage();

  function load() {
    fetch(`${API}/letters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setLetters(d.letters); })
      .catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function schedule() {
    if (!text.trim() || !date) { setMsg(t("scheduledLetters.msgMissingFields")); return; }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/letters`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ text, deliverOn: date }) });
      const data = await res.json();
      if (data.success) {
        setText(""); setDate("");
        load();
      } else {
        setMsg(data.message || t("scheduledLetters.msgCouldntSchedule"));
      }
    } catch {
      setMsg(t("scheduledLetters.msgSomethingWrong"));
    }
    setLoading(false);
  }

  async function remove(id) {
    await fetch(`${API}/letters/${id}`, { method: "DELETE", headers: authHeaders() });
    load();
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>✉️ {t("scheduledLetters.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("scheduledLetters.subtitle")}</p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("scheduledLetters.textareaPlaceholder")} rows={5} style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
        <button onClick={schedule} disabled={loading} style={{ padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
          {loading ? t("scheduledLetters.scheduling") : t("scheduledLetters.scheduleIt")}
        </button>
      </div>
      {msg && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{msg}</p>}

      {letters.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>{t("scheduledLetters.yourLettersHeading")}</p>
          {letters.filter((l) => l.delivered).length > 1 && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("scheduledLetters.searchPlaceholder")}
              style={{ width: "100%", padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", marginBottom: 10 }}
            />
          )}
          {letters
            .filter((l) => !l.delivered || !search.trim() || l.text.toLowerCase().includes(search.trim().toLowerCase()))
            .map((l) => (
            <div key={l._id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", marginTop: 8 }}>
              {l.delivered ? (
                <>
                  <p style={{ fontSize: 11, opacity: 0.5 }}>{t("scheduledLetters.deliveredOn", { date: l.deliverOn })}</p>
                  <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{l.text}</p>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>🔒 {t("scheduledLetters.lockedUntil", { date: l.deliverOn })}</span>
                  <button onClick={() => remove(l._id)} style={{ fontSize: 11, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>{t("scheduledLetters.cancel")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
