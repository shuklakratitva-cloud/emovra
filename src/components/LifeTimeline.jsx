import React, { useState, useEffect } from "react";

const LS_KEY = "emovra_life_timeline";
function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } }
function save(events) { localStorage.setItem(LS_KEY, JSON.stringify(events)); }

export default function LifeTimeline() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { setEvents(load()); }, []);

  function addEvent() {
    if (!title.trim() || !date) return;
    const next = [...load(), { title: title.trim(), date, note: note.trim() }].sort((a, b) => a.date.localeCompare(b.date));
    save(next);
    setEvents(next);
    setTitle(""); setDate(""); setNote("");
  }

  function remove(i) {
    const next = events.filter((_, idx) => idx !== i);
    save(next);
    setEvents(next);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🕰️ Life Timeline</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Mark the moments that mattered - big or small. Private, stored on this device.</p>

      <div style={{ marginTop: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What happened?" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note (optional)" style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
        </div>
        <button onClick={addEvent} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Add to timeline</button>
      </div>

      {events.length > 0 && (
        <div style={{ marginTop: 20, position: "relative", paddingLeft: 20 }}>
          <div style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: "var(--border)" }} />
          {events.map((e, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 16 }}>
              <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
              <div style={{ fontSize: 11, opacity: 0.5 }}>{e.date}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{e.title}</div>
              {e.note && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{e.note}</div>}
              <button onClick={() => remove(i)} style={{ fontSize: 10, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", marginTop: 4, padding: 0 }}>remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
