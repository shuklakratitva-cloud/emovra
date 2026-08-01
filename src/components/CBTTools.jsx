import React, { useState, useEffect } from "react";

const LS_KEY = "emovra_cbt_data";
function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } }
function save(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

const DISTORTIONS = [
  { id: "catastrophizing", label: "Catastrophizing", desc: "Assuming the worst possible outcome" },
  { id: "mindreading", label: "Mind reading", desc: "Assuming you know what others think" },
  { id: "allornothing", label: "All-or-nothing", desc: "Seeing things as totally good or totally bad" },
  { id: "overgeneralizing", label: "Overgeneralizing", desc: "One bad moment means it always happens" },
  { id: "shoulds", label: "\"Should\" statements", desc: "Rigid rules about how things must be" },
  { id: "personalizing", label: "Personalizing", desc: "Blaming yourself for things outside your control" },
];

const VALUES_LIST = ["Honesty", "Family", "Growth", "Creativity", "Independence", "Connection", "Kindness", "Achievement", "Adventure", "Stability", "Justice", "Curiosity", "Health", "Loyalty", "Freedom", "Balance"];

function ThoughtReframe() {
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [distortions, setDistortions] = useState([]);
  const [reframe, setReframe] = useState("");
  const [saved, setSaved] = useState([]);

  useEffect(() => { setSaved(load().reframes || []); }, []);

  function toggleDistortion(id) {
    setDistortions((d) => d.includes(id) ? d.filter((x) => x !== id) : [...d, id]);
  }

  function finish() {
    const data = load();
    const entry = { situation, thought, distortions, reframe, date: new Date().toISOString() };
    data.reframes = [entry, ...(data.reframes || [])].slice(0, 50);
    save(data);
    setSaved(data.reframes);
    setStep(1); setSituation(""); setThought(""); setDistortions([]); setReframe("");
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>1. What happened?</p>
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="The situation, just the facts..." rows={2} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
          <button onClick={() => setStep(2)} disabled={!situation.trim()} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Next</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>2. What thought went through your mind?</p>
          <textarea value={thought} onChange={(e) => setThought(e.target.value)} placeholder="The automatic thought..." rows={2} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
          <button onClick={() => setStep(3)} disabled={!thought.trim()} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Next</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>3. Does this thought match a pattern? (optional, pick any)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {DISTORTIONS.map((d) => (
              <button key={d.id} onClick={() => toggleDistortion(d.id)} title={d.desc} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11, cursor: "pointer", border: distortions.includes(d.id) ? "1px solid var(--accent)" : "1px solid var(--border)", background: distortions.includes(d.id) ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(4)} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Next</button>
        </div>
      )}
      {step === 4 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>4. What's a more balanced way to see it?</p>
          <textarea value={reframe} onChange={(e) => setReframe(e.target.value)} placeholder="A fairer, more complete version of the thought..." rows={2} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }} />
          <button onClick={finish} disabled={!reframe.trim()} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>Save</button>
        </div>
      )}

      {saved.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Past reframes</p>
          {saved.slice(0, 5).map((r, i) => (
            <div key={i} style={{ fontSize: 12, padding: "8px 0", opacity: 0.8 }}>
              <b>{r.thought}</b> → {r.reframe}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STRENGTHS = ["Persistence", "Empathy", "Humor", "Creativity", "Loyalty", "Curiosity", "Patience", "Honesty", "Adaptability", "Courage", "Focus", "Optimism"];
function StrengthsFinder() {
  const [picked, setPicked] = useState([]);
  useEffect(() => { setPicked(load().strengths || []); }, []);
  function toggle(v) {
    setPicked((p) => {
      const next = p.includes(v) ? p.filter((x) => x !== v) : [...p, v];
      const data = load(); data.strengths = next; save(data);
      return next;
    });
  }
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>What do people actually rely on you for? Pick whatever feels true.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {STRENGTHS.map((v) => (
          <button key={v} onClick={() => toggle(v)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: picked.includes(v) ? "1px solid var(--accent)" : "1px solid var(--border)", background: picked.includes(v) ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

const TOOLS = [
  { id: "reframe", label: "🔄 Thought Reframe", Component: ThoughtReframe },
  { id: "strengths", label: "💪 Strengths", Component: StrengthsFinder },
];

export default function CBTTools() {
  const [active, setActive] = useState("reframe");
  const Active = TOOLS.find((t) => t.id === active)?.Component;

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🧠 Thought Tools</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>CBT-style exercises - not a diagnosis or treatment, just structured ways to think things through. Saved privately on this device.</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === t.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === t.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === t.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === t.id ? 700 : 500 }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
