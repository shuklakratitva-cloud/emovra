import { useState, useEffect } from "react";

const API = "https://emovra.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const EMOJI_OPTIONS = ["✅", "💧", "🏃", "📚", "🧘", "🥗", "😴", "🎨"];

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      const res = await fetch(`${API}/habits`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setHabits(data.habits);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addHabit() {
    if (!title.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/habits`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ title, emoji }) });
      const data = await res.json();
      if (data.success) { setHabits((h) => [...h, data.habit]); setTitle(""); }
    } catch {}
    setAdding(false);
  }

  async function complete(id) {
    try {
      const res = await fetch(`${API}/habits/${id}/complete`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setHabits((h) => h.map((x) => (x._id === id ? data.habit : x)));
        if (data.newBadges?.length) {
          setToast(`🎉 New badge: ${data.newBadges.map((b) => b.name).join(", ")}!`);
          setTimeout(() => setToast(null), 3500);
        }
      } else {
        alert(data.message || "Already done today");
      }
    } catch {}
  }

  async function remove(id) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await fetch(`${API}/habits/${id}`, { method: "DELETE", headers: authHeaders() });
      setHabits((h) => h.filter((x) => x._id !== id));
    } catch {}
    setDeletingId(null);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🌱 Habit Tracker</h2>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Small daily habits, tracked one check-in at a time.</p>

      {toast && <div style={{ marginTop: 10, background: "rgba(212,176,122,0.15)", border: "1px solid #d4b07a", borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {EMOJI_OPTIONS.map((e) => (
          <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 18, padding: "6px 10px", borderRadius: 10, border: emoji === e ? "2px solid #d4b07a" : "1px solid var(--border)", background: "transparent", cursor: "pointer" }}>
            {e}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Drink 8 glasses of water" style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />
        <button onClick={addHabit} disabled={adding} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "0 18px", borderRadius: 10, fontWeight: 700, cursor: adding ? "default" : "pointer", opacity: adding ? 0.6 : 1 }}>{adding ? "..." : "Add"}</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <p style={{ fontSize: 13, opacity: 0.6 }}>Loading...</p> : habits.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.6 }}>No habits yet - add one above.</p>
        ) : habits.map((h) => {
          const doneToday = h.lastCompletedDate === today;
          return (
            <div key={h._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{h.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>🔥 {h.streak} day streak · best {h.longestStreak}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {doneToday ? (
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>✓ Done today</span>
                ) : (
                  <button onClick={() => complete(h._id)} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    Mark done
                  </button>
                )}
                <button onClick={() => remove(h._id)} disabled={deletingId === h._id} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: deletingId === h._id ? "default" : "pointer", fontSize: 16, opacity: deletingId === h._id ? 0.4 : 1 }}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
