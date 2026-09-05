import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { API_BASE as API } from "../config/api.js";
export default function PersonalityQuiz() {
  const { t, lang } = useLanguage();
  const isHi = lang === "hi";
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // FIX: this fetch had no .catch() and no error state. The backend sleeps
  // on Render's free tier, so the first request after an idle period
  // routinely fails or times out while the instance wakes - and when it
  // did, the promise rejected unhandled, `quiz` stayed null, and the
  // component sat on "Loading..." forever with no way to retry short of
  // reloading the whole page. Same for a plain offline moment. Track the
  // failure and offer a retry instead.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/quiz/strength`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          setQuiz(d.quiz);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);
  async function submit() {
    if (!quiz || Object.keys(answers).length < quiz.questions.length) return;
    setLoading(true);
    setSubmitError(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/quiz/strength/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      // FIX: an empty catch plus an unchecked `success` meant a failed
      // submit just turned the button back on with nothing shown - the
      // user pressed it again and again with no idea anything went wrong.
      if (data.success) setResult(data.result);
      else setSubmitError(true);
    } catch {
      setSubmitError(true);
    }
    setLoading(false);
  }
  function retake() { setResult(null); setAnswers({}); setSubmitError(false); }
  const quizTitle = quiz ? (isHi && quiz.title_hi ? quiz.title_hi : quiz.title) : null;
  const resultLabel = result ? (isHi && result.label_hi ? result.label_hi : result.label) : null;
  const resultDescription = result ? (isHi && result.description_hi ? result.description_hi : result.description) : null;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🧩 {quizTitle || t("personalityQuiz.title")}</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{t("personalityQuiz.subtitle")}</p>
      {result ? (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ fontSize: 44 }}>{result.emoji}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#d4c5a0", marginTop: 8 }}>{resultLabel}</div>
          <p style={{ fontSize: 13, marginTop: 8, maxWidth: 420, margin: "8px auto", lineHeight: 1.5 }}>{resultDescription}</p>
          <button onClick={retake} style={{ marginTop: 14, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 12 }}>{t("personalityQuiz.retakeQuiz")}</button>
        </div>
      ) : !quiz ? (
        loadError ? (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>{t("personalityQuiz.loadFailed")}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} style={{ marginTop: 10, background: "#d4b07a", color: "#000", border: "none", padding: "8px 18px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t("personalityQuiz.retry")}</button>
          </div>
        ) : (
          <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>{t("personalityQuiz.loading")}</p>
        )
      ) : (
        <div style={{ marginTop: 16 }}>
          {quiz.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{isHi && q.text_hi ? q.text_hi : q.text}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((o) => (
                  <label key={o.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 10px", borderRadius: 8, border: answers[q.id] === o.key ? "1px solid #d4b07a" : "1px solid var(--border)", background: answers[q.id] === o.key ? "rgba(212,176,122,0.1)" : "transparent" }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === o.key} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))} />
                    {isHi && o.label_hi ? o.label_hi : o.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submit} disabled={loading || Object.keys(answers).length < quiz.questions.length} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: Object.keys(answers).length < quiz.questions.length ? 0.5 : 1 }}>
            {loading ? t("personalityQuiz.scoring") : t("personalityQuiz.seeMyResult")}
          </button>
          {submitError && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 10 }}>{t("personalityQuiz.submitFailed")}</p>}
        </div>
      )}
    </div>
  );
}
