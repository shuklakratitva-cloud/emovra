import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from "../components/ThemeToggle";
import RiskCard from "../components/RiskCard";
import MoodTracker from "../components/MoodTracker";
import MoodChart from "../components/MoodChart";
import Journal from "../components/Journal";
import GroundingExercises from "../components/GroundingExercises";
import TeleManas from "../components/TeleManas";
import { getCounselingAdvice, getTopEmotions } from "../utils/counselor.js";
import VoiceToneAnalyzer from "../components/VoiceToneAnalyzer.jsx";
import { saveAnalysis, loadAnalysis } from "../utils/storage";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { analyzeWithGemini } from "../utils/geminiAnalyzer.js";
import { analyzeRisk } from "../utils/analyzeRisk.js";
import Auth from "../components/Auth.jsx";
import LegalCookieBanner from "../components/LegalCookieBanner.jsx";
import '../App.css';

const API = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

function getAdvice(level) {
  const lvl = String(level || "").toUpperCase();
  if (lvl === "GREEN") return "You're in a stable range. Maintain healthy habits. Keep smiling! 😊";
  if (lvl === "YELLOW") return "Slight stress detected. Try Box Breathing 4-4-4-4.";
  if (lvl === "ORANGE") return "Please talk to a trusted friend or counselor.";
  return "You matter. You are not alone. Help is available if you need it.";
}

export default function MindGuardApp() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [voiceData, setVoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => { try { const s = localStorage.getItem('emovra_history'); return s? JSON.parse(s) : []; } catch { return []; } });

  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  useEffect(() => { if (transcript) setInputText(transcript); }, [transcript]);

  useEffect(() => {
    try {
      const old = loadAnalysis();
      if (old && old.text) setAnalysis(old);
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API}/data/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { if (Array.isArray(d) && d.length) setHistory(d.reverse().slice(-20)); })
        .catch(() => {});
      }
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem('emovra_history', JSON.stringify(history)); } catch {} }, [history]);

  async function saveToBackend(entry) {
    const t = localStorage.getItem('token'); if (!t) return;
    try { await fetch(`${API}/data/save`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(entry) }); } catch {}
  }

  function handleLogout() { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('emovra_history'); setUser(null); navigate("/", { replace: true }); }

  async function handleAnalyze() {
    if (!inputText.trim()) return; setLoading(true);
    const lower = inputText.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
    const redKeys = ["i want to die", "kill myself", "end my life", "suicide", "no one will know if i die", "want to kill", "murder", "slit", "choke", "mujhe marna hai", "marna hai mujhe", "mar jana hai", "mar jau", "jeena nahi hai", "khatam karna hai", "khud ko khatam", "khudkushi", "zindagi khatam", "marna chahta hu", "nahi jeena", "zindagi se tang", "life se tang", "pareshan hu marna", "i will kill him"];
    if (redKeys.some(k => lower.includes(k))) {
      const forced = { riskLevel: "RED", score: 98, emotion: "critical", sentiment: "negative", reasons: [`critical/self-harm detected`], advice: "You matter. Please reach out now.", isCrisis: true, text: inputText, timestamp: new Date().toISOString(), id: Date.now(), counseling: getCounselingAdvice(inputText, "critical", "RED"), topEmotions: getTopEmotions(inputText), voiceTone: voiceData };
      const t = localStorage.getItem('token'); if (t) { fetch(`${API}/alerts/red`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ text: inputText, score: 98, reasons: forced.reasons, riskLevel: "RED" }) }).catch(() => {}); }
      setAnalysis(forced); setHistory(h => [...h, forced].slice(-20)); try { saveAnalysis(forced); } catch {} saveToBackend(forced); setInputText(""); setLoading(false); return;
    }
    let result;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/emotion/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token? `Bearer ${token}` : "" }, body: JSON.stringify({ text: inputText }) });
      if (res.ok) { const data = await res.json(); result = { riskLevel: data.color || data.riskLevel || "GREEN", score: data.score || 85, emotion: data.emotion || "happy", sentiment: data.sentiment || "positive", reasons: data.triggers? [data.triggers] : data.reasons || ["ai analysis"], advice: data.advice || "", source: data.isAI? "gemini-backend" : "backend-ai", confidence: data.confidence || 0.9 }; } else { throw new Error("backend failed"); }
    } catch (e) {
      try { const g = await analyzeWithGemini(inputText, voiceData); result = { riskLevel: g.level || "GREEN", score: g.score || 75, emotion: g.emotion || "neutral", sentiment: g.sentiment || "neutral", reasons: g.reasons || [], advice: g.advice || "", source: "gemini-frontend" }; } catch { const f = analyzeRisk(inputText); if (lower.includes("happy") || lower.includes("great") || lower.includes("good") || lower.includes("awesome") || lower.includes("joy")) { result = { riskLevel: "GREEN", score: 88, emotion: "happy", sentiment: "positive", reasons: ["positive keywords: happy"], advice: "", source: "fallback-fixed" }; } else { result = {...f, source: "fallback" }; } }
    }
    const withTime = {...result, counseling: getCounselingAdvice(inputText, result.emotion, result.riskLevel), topEmotions: getTopEmotions(inputText), voiceTone: voiceData, timestamp: new Date().toISOString(), id: Date.now(), text: inputText };
    setAnalysis(withTime); setHistory(h => [...h, withTime].slice(-20)); try { saveAnalysis(withTime); } catch {} saveToBackend(withTime); setInputText(""); setLoading(false);
  }

  if (!user) { return ( <> <Auth onAuth={setUser} onLogin={setUser} /> <LegalCookieBanner /> </> ); }

  const advice = getAdvice(analysis?.riskLevel);
  const counselingArray = Array.isArray(analysis?.counseling)? analysis.counseling : [];
  const isAdmin = user.role === "admin";

  return (
    <>
      {/* BLACK GOLD GLOBAL OVERRIDE - NO FEATURE LOSS */}
      <style>{`
        body{background:#0a0a0c!important}
       .gold{color:#d4c5a0}
       .tracking-mini{letter-spacing:0.18em;text-transform:uppercase;font-size:9px}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#0a0a0c', color:'#e8dcc6' }}>
        {/* HEADER - BLACK GOLD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 20px", maxWidth: 900, margin: "0 auto", position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,12,0.92)", backdropFilter:'blur(20px)', borderBottom: "0.5px solid rgba(212,197,160,0.15)" }}>
          <div onClick={() => navigate("/")} style={{ fontWeight: 800, fontSize: 18, color: "#d4c5a0", cursor: "pointer" }}>MindGuard ♛</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color:'#e8dcc6', opacity:0.7 }}>Hi, {user.name} {isAdmin && "👑"}</span>
            {isAdmin && (<button onClick={() => navigate("/admin")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "rgba(212,197,160,0.1)", color: "#d4c5a0", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Admin</button>)}
            <ThemeToggle />
            <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "#141416", color: "#d4c5a0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Logout</button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "18px auto", padding: "0 16px" }}>
          {/* INPUT CARD - BLACK GOLD */}
          <div style={{ padding: 20, borderRadius: 16, border: "0.5px solid rgba(212,197,160,0.18)", background: "rgba(18,18,20,0.95)" }}>
            <h3 style={{ margin: "0 0 12px 0", color:'#e8dcc6', fontSize:16, fontWeight:600 }}>How are you feeling today?</h3>
            <textarea rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); handleAnalyze(); } }} placeholder="Type what's on your mind..." style={{ width: "100%", padding: 14, borderRadius: 12, border: "0.5px solid rgba(212,197,160,0.18)", background: "#0f0f11", color: "#e8dcc6", outline:'none' }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: "10px 18px", borderRadius: 999, border: "none", background: "#d4b07a", color: "#000", fontWeight: 800, cursor:'pointer', fontSize:12 }}>{loading? "Analyzing..." : "✨ Analyze"}</button>
              <button onClick={() => (listening? stopListening() : startListening())} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background:'transparent', color:'#d4c5a0', cursor:'pointer', fontSize:12 }}>🎙 {listening? "Stop" : "Speak"}</button>
              <button onClick={() => { setInputText(""); setAnalysis(null); }} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.12)", background:'transparent', color:'rgba(232,220,198,0.6)', cursor:'pointer', fontSize:12 }}>Clear</button>
            </div>
          </div>

          {analysis && (
            <div style={{ marginTop: 16 }}>
              {analysis.riskLevel === "RED" && (
                <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, color: "#fca5a5", marginBottom: 12 }}>
                  <b>🚨 RED CODE - We are here for you</b>
                  <div style={{ fontSize: 13, marginTop: 6, color:'rgba(255,255,255,0.7)' }}>We noticed you're going through a tough time. You are not alone.</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <a href="tel:14416" style={{ padding: "10px 16px", background: "#d4c5a0", color: "#000", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize:12 }}>Call Tele-MANAS 14416</a>
                    {user.emergencyPhone && (<a href={`tel:${user.emergencyPhone}`} style={{ padding: "10px 16px", background: "#dc2626", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize:12 }}>Call SOS: {user.emergencyPhone}</a>)}
                  </div>
                </div>
              )}
              <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:8 }}>
                <RiskCard analysis={analysis} text={analysis.text} />
                <MoodChart history={history.length? history : [analysis]} />
              </div>
              <div style={{ marginTop: 12, padding: 14, border: "0.5px solid rgba(212,197,160,0.18)", borderRadius: 12, background: "rgba(18,18,20,0.9)", color: "#e8dcc6", fontSize:13 }}><b style={{ color:'#d4c5a0' }}>Advice:</b> {advice}</div>
              {counselingArray.length > 0 && (<div style={{ marginTop: 12 }}><h4 style={{ color:'#d4c5a0' }}>Solutions</h4>{counselingArray.map((c, i) => (<div key={i} style={{ padding: 12, border: "0.5px solid rgba(212,197,160,0.15)", background:'rgba(18,18,20,0.9)', borderRadius: 10, marginTop: 8, fontSize:13 }}><b style={{ color:'#d4c5a0' }}>{c.technique}</b><p style={{ margin:'6px 0 0 0', color:'rgba(232,220,198,0.7)' }}>{c.advice}</p></div>))}</div>)}
            </div>
          )}

          <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'rgba(18,18,20,0.6)', border:'0.5px solid rgba(212,197,160,0.12)', borderRadius:12, padding:12 }}>
              <VoiceToneAnalyzer onResult={setVoiceData} />
            </div>
            <MoodTracker />
            <Journal />
            <GroundingExercises />
            <TeleManas />
          </div>

          <div style={{ marginTop: 40, padding: '16px', textAlign: 'center', fontSize: '11px', color: 'rgba(232,220,198,0.4)', borderTop: '0.5px solid rgba(212,197,160,0.12)' }}>
            Emovra / MindGuard is for wellness support only and does not provide medical diagnosis or treatment. If you are in crisis, call Kiran 1800-599-0019 or 112.
          </div>
        </div>
        <LegalCookieBanner />
      </div>
    </>
  );
}