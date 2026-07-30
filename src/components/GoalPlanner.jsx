import { useEffect, useState } from "react";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function GoalPlanner() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [milestoneText, setMilestoneText] = useState("");
  const [milestones, setMilestones] = useState([]);

  async function load() {
    try {
      const res = await fetch(`${API}/goals`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setGoals(data.goals);
    } catch {}
  }
  useEffect(() => { load(); }, []);

  function addMilestone() {
    if (!milestoneText.trim()) return;
    setMilestones((m) => [...m, milestoneText.trim()]);
    setMilestoneText("");
  }

  async function createGoal() {
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API}/goals`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ title, milestones }) });
      const data = await res.json();
      if (data.success) { setGoals((g) => [data.goal, ...g]); setTitle(""); setMilestones([]); }
    } catch {}
  }

  async function toggleMilestone(goalId, idx) {
    try {
      const res = await fetch(`${API}/goals/${goalId}/milestone/${idx}/toggle`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) setGoals((g) => g.map((x) => (x._id === goalId ? data.goal : x)));
    } catch {}
  }

  async function remove(id) {
    try { await fetch(`${API}/goals/${id}`, { method: "DELETE", headers: authHeaders() }); setGoals((g) => g.filter((x) => x._id !== id)); } catch {}
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🗺 Goal Planner</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Break a goal into small steps you can actually check off.</p>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title, e.g. Feel calmer before exams" style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", marginTop: 14 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={milestoneText} onChange={(e) => setMilestoneText(e.target.value)} placeholder="Add a milestone..." onKeyDown={(e) => e.key === "Enter" && addMilestone()} style={{ flex: 1, padding: 8, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />
        <button onClick={addMilestone} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 10, padding: "0 14px", cursor: "pointer" }}>+</button>
      </div>
      {milestones.length > 0 && (
        <ul style={{ fontSize: 12, marginTop: 6, paddingLeft: 18, opacity: 0.8 }}>
          {milestones.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
      <button onClick={createGoal} style={{ marginTop: 10, background: "#d4b07a", color: "#000", border: "none", padding: "8px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Create Goal</button>

      <div style={{ marginTop: 20 }}>
        {goals.length === 0 ? <p style={{ fontSize: 13, opacity: 0.6 }}>No goals yet.</p> : goals.map((g) => (
          <div key={g._id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 10, opacity: g.completed ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: 14 }}>{g.completed ? "🎉 " : ""}{g.title}</b>
              <button onClick={() => remove(g._id)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}>×</button>
            </div>
            {g.milestones.map((m, idx) => (
              <label key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={m.done} onChange={() => toggleMilestone(g._id, idx)} />
                <span style={{ textDecoration: m.done ? "line-through" : "none", opacity: m.done ? 0.6 : 1 }}>{m.text}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
