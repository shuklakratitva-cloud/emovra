import { useEffect, useState } from "react";

const API = "https://emovra.onrender.com/api";

export default function PersonalityQuiz() {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/quiz/strength`).then((r) => r.json()).then((d) => { if (d.success) setQuiz(d.quiz); });
  }, []);

  async function submit() {
    if (!quiz || Object.keys(answers).length < quiz.questions.length) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/quiz/strength/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) setResult(data.result);
    } catch {}
    setLoading(false);
  }

  function retake() { setResult(null); setAnswers({}); }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🧩 {quiz?.title || "Strength Quiz"}</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Just for fun and reflection - not a clinical assessment.</p>

      {result ? (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ fontSize: 44 }}>{result.emoji}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#d4c5a0", marginTop: 8 }}>{result.label}</div>
          <p style={{ fontSize: 13, marginTop: 8, maxWidth: 420, margin: "8px auto", lineHeight: 1.5 }}>{result.description}</p>
          <button onClick={retake} style={{ marginTop: 14, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 12 }}>Retake quiz</button>
        </div>
      ) : !quiz ? (
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>Loading...</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          {quiz.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{q.text}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((o) => (
                  <label key={o.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 10px", borderRadius: 8, border: answers[q.id] === o.key ? "1px solid #d4b07a" : "1px solid var(--border)", background: answers[q.id] === o.key ? "rgba(212,176,122,0.1)" : "transparent" }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === o.key} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submit} disabled={loading || Object.keys(answers).length < quiz.questions.length} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: Object.keys(answers).length < quiz.questions.length ? 0.5 : 1 }}>
            {loading ? "Scoring..." : "See my result"}
          </button>
        </div>
      )}
    </div>
  );
}
