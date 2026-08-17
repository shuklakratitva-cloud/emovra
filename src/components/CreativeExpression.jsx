import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// NOTE: "Anonymous artwork gallery" and public photo sharing from the
// original list were deliberately NOT built as public/shared features -
// unmoderated user-generated content visible to other users is a real
// safety risk for a youth mental health app, and moderation
// infrastructure is a much bigger undertaking than this pass. Everything
// here is private to the person who made it, same trust model as the
// Personal Journal.

const LS_KEY = "emovra_creative_data";
function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } }
function save(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function Poetry() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState([]);
  useEffect(() => { setSaved(load().poems || []); }, []);
  function savePoem() {
    if (!text.trim()) return;
    const data = load();
    data.poems = [{ text: text.trim(), date: new Date().toISOString() }, ...(data.poems || [])];
    save(data);
    setSaved(data.poems);
    setText("");
  }
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("creativeExpression.poetryPlaceholder")} rows={6} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)", fontFamily: "inherit" }} />
      <button onClick={savePoem} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>{t("creativeExpression.save")}</button>
      {saved.map((p, i) => (
        <div key={i} style={{ marginTop: 14, padding: 12, borderRadius: 10, border: "1px solid var(--border)", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>{p.text}</div>
      ))}
    </div>
  );
}

function StickerJournal() {
  const { t } = useLanguage();
  const STICKERS = ["😊","😌","😢","😰","😡","🥱","💭","❤️","🌧","☀️","🌙","✨","🔥","🌱","☕","🎵"];
  const [entryStickers, setEntryStickers] = useState([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState([]);
  useEffect(() => { setSaved(load().stickerEntries || []); }, []);
  function addSticker(s) { setEntryStickers((arr) => [...arr, s]); }
  function saveEntry() {
    if (entryStickers.length === 0 && !note.trim()) return;
    const data = load();
    data.stickerEntries = [{ stickers: entryStickers, note, date: new Date().toISOString() }, ...(data.stickerEntries || [])];
    save(data);
    setSaved(data.stickerEntries);
    setEntryStickers([]); setNote("");
  }
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {STICKERS.map((s) => (
          <button key={s} onClick={() => addSticker(s)} style={{ fontSize: 22, background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: 4, cursor: "pointer" }}>{s}</button>
        ))}
      </div>
      <div style={{ marginTop: 10, minHeight: 32, fontSize: 24 }}>{entryStickers.join(" ")}</div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("creativeExpression.stickerNotePlaceholder")} style={{ width: "100%", marginTop: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
      <button onClick={saveEntry} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>{t("creativeExpression.saveEntry")}</button>
      {saved.slice(0, 8).map((e, i) => (
        <div key={i} style={{ marginTop: 10, fontSize: 18 }}>{e.stickers.join(" ")} {e.note && <span style={{ fontSize: 12, opacity: 0.6 }}>- {e.note}</span>}</div>
      ))}
    </div>
  );
}

function Scrapbook() {
  const { t } = useLanguage();
  const STICKERS = ["🌸","⭐","🍃","🎈","💫","🌈","☀️","🌙","❤️","✨"];
  const [note, setNote] = useState("");
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [pages, setPages] = useState([]);
  useEffect(() => { setPages(load().scrapbook || []); }, []);

  function savePage() {
    if (!note.trim()) return;
    const data = load();
    data.scrapbook = [{ note: note.trim(), sticker, date: new Date().toISOString() }, ...(data.scrapbook || [])];
    save(data);
    setPages(data.scrapbook);
    setNote("");
  }

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>{t("creativeExpression.scrapbookIntro")}</p>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {STICKERS.map((s) => (
          <button key={s} onClick={() => setSticker(s)} style={{ fontSize: 20, padding: 6, borderRadius: 8, cursor: "pointer", border: sticker === s ? "2px solid var(--accent)" : "1px solid var(--border)", background: "transparent" }}>{s}</button>
        ))}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("creativeExpression.scrapbookPlaceholder")} rows={3} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
      <button onClick={savePage} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>{t("creativeExpression.addPage")}</button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 18 }}>
        {pages.map((p, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(212,176,122,0.05)" }}>
            <div style={{ fontSize: 22 }}>{p.sticker}</div>
            <p style={{ fontSize: 12, margin: "6px 0 0", lineHeight: 1.4 }}>{p.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "poetry", labelKey: "creativeExpression.tabPoetry", Component: Poetry },
  { id: "stickers", labelKey: "creativeExpression.tabStickers", Component: StickerJournal },
  { id: "scrapbook", labelKey: "creativeExpression.tabScrapbook", Component: Scrapbook },
];

export default function CreativeExpression() {
  const { t } = useLanguage();
  const [active, setActive] = useState("poetry");
  const Active = TABS.find((tab) => tab.id === active)?.Component;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>{t("creativeExpression.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("creativeExpression.subtitle")}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === tab.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === tab.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === tab.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === tab.id ? 700 : 500 }}>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
