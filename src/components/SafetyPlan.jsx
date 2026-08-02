import React, { useState, useEffect } from "react";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const FIELDS = [
  { key: "warningSigns", label: "My warning signs", placeholder: "Thoughts, feelings, or situations that tell me I'm struggling...", helper: "What tends to show up before things get hard?" },
  { key: "copingStrategies", label: "Things that actually help me", placeholder: "Breathing exercises, music, calling someone, going outside...", helper: "Not generic advice - what genuinely works for YOU?" },
  { key: "supportContacts", label: "People I can reach out to", placeholder: "Names and how to reach them...", helper: "Beyond your emergency contact - friends, family, anyone you trust." },
  { key: "reasonsToLive", label: "Reasons that matter to me", placeholder: "People, goals, pets, plans, anything...", helper: "Things worth holding onto, in your own words." },
];

export default function SafetyPlan() {
  const [values, setValues] = useState({ warningSigns: "", copingStrategies: "", supportContacts: "", reasonsToLive: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/safety-plan`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.plan) setValues({ warningSigns: d.plan.warningSigns, copingStrategies: d.plan.copingStrategies, supportContacts: d.plan.supportContacts, reasonsToLive: d.plan.reasonsToLive }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/safety-plan`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {}
    setSaving(false);
  }

  if (loading) return null;

  const hasAnyContent = Object.values(values).some((v) => v.trim().length > 0);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🛟 My Safety Plan</h2>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Fill this out while you're feeling okay - it's here for you on the harder days. {hasAnyContent && "This will show up if a check-in comes back RED, as a reminder written by you, for you."}
      </p>

      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{f.label}</label>
          <p style={{ fontSize: 11, opacity: 0.5, margin: "2px 0 6px" }}>{f.helper}</p>
          <textarea
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            rows={3}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }}
          />
        </div>
      ))}

      <button onClick={save} disabled={saving} style={{ marginTop: 16, padding: "10px 22px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        {saving ? "Saving..." : "Save my plan"}
      </button>
      {saved && <span style={{ marginLeft: 12, fontSize: 12, color: "#4ade80" }}>Saved ✓</span>}
    </div>
  );
}
