import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from "../components/RiskCard";
import MoodTracker from "../components/MoodTracker";
import { getCounselingAdvice, getTopEmotions } from "../utils/counselor.js";
import { saveAnalysis, loadAnalysis } from "../utils/storage";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { analyzeWithGemini } from "../utils/geminiAnalyzer.js";
import { analyzeRisk } from "../utils/analyzeRisk.js";
import Auth from "../components/Auth.jsx";
import LegalCookieBanner from "../components/LegalCookieBanner.jsx";
import '../App.css';

const MoodChart = lazy(() => import("../components/MoodChart"));
const Journal = lazy(() => import("../components/Journal"));
const GroundingExercises = lazy(() => import("../components/GroundingExercises"));
const TeleManas = lazy(() => import("../components/TeleManas"));
const VoiceToneAnalyzer = lazy(() => import("../components/VoiceToneAnalyzer.jsx"));

const API = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

function getAdvice(level, category) {
  const lvl = String(level || "").toUpperCase();
  if (category === "school_emotional_abuse") return "It's painful when words from a teacher hurt in front of class. Your worth isn't defined by one remark. Try 5-4-3-2-1 grounding and consider talking to a counselor you trust. You are not alone. 💛";
  if (lvl === "GREEN") return "You're in a stable range. Maintain healthy habits. Keep smiling! 😊";
  if (lvl === "ORANGE" || lvl === "YELLOW") return "Moderate stress detected. Please talk to a trusted friend or counselor. Try Box Breathing 4-4-4-4.";
  return "You matter. You are not alone. Help is available if you need it.";
}

const Loader = () => <div style={{ padding: 12, textAlign: 'center', color: '#d4c5a0', fontSize: 11 }}>Loading...</div>;

export default function MindGuardApp() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });
  const [voiceData, setVoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const s = localStorage.getItem('emovra_history');
      return s? JSON.parse(s) : [];
    } catch { return []; }
  });

  // --- NEW: OTP PHONE VERIFICATION STATES ---
  const [phoneInput, setPhoneInput] = useState(() => user?.phone || "");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(() =>!!user?.phoneVerified ||!!user?.phone);
  const [otpMessage, setOtpMessage] = useState("");

  const token = localStorage.getItem('token');
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();

useEffect(() => {
  const timer = setTimeout(() => {
    fetch(`${API.replace('/api','')}/health`).catch(()=>{});
    fetch(`${API}/health`).catch(()=>{});
  }, 3500);
  return () => clearTimeout(timer);
}, []);

  useEffect(() => { if (transcript) setInputText(transcript); }, [transcript]);

  useEffect(() => {
    try {
      const old = loadAnalysis();
      if (old && old.text) setAnalysis(old);
      if (token) {
        fetch(`${API}/data/my`, { headers: { Authorization: `Bearer ${token}` } })
  .then(r => { if (!r.ok) throw new Error('no data'); return r.json(); })
  .then(d => { if (Array.isArray(d) && d.length) setHistory(d.reverse().slice(-20)); })
  .catch(() => {});
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    try { localStorage.setItem('emovra_history', JSON.stringify(history)); } catch {}
  }, [history]);

  // --- NEW: OTP FUNCTIONS - RANDOM EVERY TIME ---
  async function sendOtp() {
    if (!phoneInput || phoneInput.length < 10) {
      setOtpMessage("Enter valid 10 digit phone");
      return;
    }
    setOtpLoading(true);
    setOtpMessage("");
    try {
      // This backend route generates crypto.randomInt(100000,999999) EVERY time
      const res = await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token? `Bearer ${token}` : "" },
        body: JSON.stringify({ phone: phoneInput })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpMessage(`OTP sent to ${phoneInput}. Check Render logs for OTP if SMS not configured. ${data.otp? `(Dev OTP: ${data.otp})` : ''}`);
      } else {
        setOtpMessage(data.msg || "Failed to send OTP");
      }
    } catch (e) {
      setOtpMessage("Network error sending OTP");
    }
    setOtpLoading(false);
  }

  async function verifyOtp() {
    if (!otpInput) {
      setOtpMessage("Enter OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token? `Bearer ${token}` : "" },
        body: JSON.stringify({ phone: phoneInput, otp: otpInput })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setPhoneVerified(true);
        setOtpMessage("✅ Phone verified successfully!");
        const updatedUser = {...user, phone: phoneInput, phoneVerified: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setOtpSent(false);
        setOtpInput("");
      } else {
        setOtpMessage(data.msg || "Invalid OTP");
      }
    } catch (e) {
      setOtpMessage("Verification failed");
    }
    setOtpLoading(false);
  }

  async function saveToBackend(entry) {
    // PRIVACY FIX: Only RED/ORANGE to backend, GREEN/YELLOW only local
    if (entry.riskLevel!== "RED" && entry.riskLevel!== "ORANGE") {
      console.log("Privacy: GREEN not saved to backend, only local");
      return;
    }
    if (!token) return;
    try {
      await fetch(`${API}/data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(entry)
      });
    } catch {}
  }

  async function saveAlertToAdmin(text, score, riskLevel, reasons, category, abuseType, abuseSource) {
    // NEW REQUIREMENT: alerts = ONLY emotional abuse in classrooms
    // So skip if not school_emotional_abuse
    if (category!== "school_emotional_abuse") {
      console.log(`Skipped alerts - category is ${category}, only school_emotional_abuse allowed`);
      return;
    }
    // Also only RED/ORANGE
    if (riskLevel!== "RED" && riskLevel!== "ORANGE") return;
    if (!token) return;
    try {
      await fetch(`${API}/alerts/red`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text, score, riskLevel, reasons, category: category || "school_emotional_abuse",
          abuseType: abuseType || "school_emotional_abuse", abuseSource: abuseSource || "teacher",
          phone: phoneInput || user?.phone || "",
          userEmail: user?.email, userName: user?.name, userId: user?._id || user?.id || localStorage.getItem('userId'),
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn("Alert save failed:", e.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('emovra_history');
    setUser(null);
    navigate("/", { replace: true });
  }

  async function handleAnalyze() {
    if (!inputText.trim()) return;
    setLoading(true);

    const rawLower = inputText.toLowerCase();
    const lower = rawLower.replace(/[^a-z0-9 ]/g, " ");
    const hasNegation = /(nahi|nahin|matlab nahi|don't|dont|do not|not want|never|nahin hai)\b/.test(rawLower) || lower.includes("dont") || lower.includes("not");

    const redKeys = ["kill myself", "end my life", "suicide", "no one will know if i die", "want to kill", "slit", "choke", "mar jana hai", "mar jau", "jeena nahi hai", "khatam karna hai", "khud ko khatam", "khudkushi", "zindagi khatam", "marna chahta hu", "nahi jeena", "zindagi se tang", "i will kill him"];
    const abuseKeys = ["beats me", "hits me", "maarta hai", "gaali deta", "abuse karta", "toxic relationship", "gaslighting"];
    // NEW: School teacher subtle remarks
    const schoolAbuseKeys = ["teacher said i am useless", "teacher insulted", "teacher beizzati", "sir ne daanta", "ma'am ne beizzati", "teacher targets me", "teacher says i will fail", "teacher makes fun", "teacher compares", "teacher always shouts", "nikamma bola", "nalayak bola teacher", "sabke samne daanta", "class me beizzati", "teacher said worthless"];

    const wantsToDie = lower.includes("i want to die") || lower.includes("mujhe marna hai") || lower.includes("marna hai mujhe");
    const isAbuseLocal = abuseKeys.some(k => lower.includes(k));
    const isSchoolAbuseLocal = schoolAbuseKeys.some(k => rawLower.includes(k)) || /teacher.*(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|beizzati|daanta)/i.test(rawLower);

    if (wantsToDie &&!hasNegation) {
      const cat = isSchoolAbuseLocal? "school_emotional_abuse" : isAbuseLocal? "emotional_abuse" : "self_harm";
      const forced = {
        riskLevel: "RED", score: 98, emotion: "critical", sentiment: "needs support",
        reasons: isSchoolAbuseLocal? ["teacher_remark","public_shaming"] : isAbuseLocal? ["critical/self-harm detected", "emotional_abuse"] : ["critical/self-harm detected"],
        advice: getAdvice("RED", cat), isCrisis: true, text: inputText,
        timestamp: new Date().toISOString(), id: Date.now(),
        counseling: getCounselingAdvice(inputText, "critical", "RED"),
        topEmotions: getTopEmotions(inputText), voiceTone: voiceData,
        isAI: false, isSafetyNet: true, category: cat, abuseType: cat, abuseSource: isSchoolAbuseLocal?"teacher": isAbuseLocal?"parent":"none"
      };
      saveAlertToAdmin(inputText, 98, "RED", forced.reasons, cat, forced.abuseType, forced.abuseSource);
      setAnalysis(forced);
      setHistory(h => [...h, forced].slice(-20));
      try { saveAnalysis(forced); } catch {}
      saveToBackend(forced);
      setInputText("");
      setLoading(false);
      return;
    }

    if (redKeys.some(k => lower.includes(k))) {
      const forced = {
        riskLevel: "RED", score: 98, emotion: "critical", sentiment: "needs support",
        reasons: ["critical/self-harm detected"], advice: getAdvice("RED","self_harm"),
        isCrisis: true, text: inputText, timestamp: new Date().toISOString(),
        id: Date.now(), counseling: getCounselingAdvice(inputText, "critical", "RED"),
        topEmotions: getTopEmotions(inputText), voiceTone: voiceData, category: "self_harm", abuseType:"none", abuseSource:"none"
      };
      saveAlertToAdmin(inputText, 98, "RED", forced.reasons, "self_harm", "none", "none");
      setAnalysis(forced);
      setHistory(h => [...h, forced].slice(-20));
      try { saveAnalysis(forced); } catch {}
      saveToBackend(forced);
      setInputText("");
      setLoading(false);
      return;
    }

    // NEW: School abuse quick local detection - goes to ORANGE + alerts
    if (isSchoolAbuseLocal) {
      const forced = {
        riskLevel: "ORANGE", score: 85, emotion: "humiliated", sentiment: "distressed",
        reasons: ["teacher_remark","public_shaming"], advice: getAdvice("ORANGE","school_emotional_abuse"),
        text: inputText, timestamp: new Date().toISOString(), id: Date.now(),
        counseling: getCounselingAdvice(inputText, "humiliated", "ORANGE"),
        topEmotions: getTopEmotions(inputText), voiceTone: voiceData,
        isAI: false, isSafetyNet: true, category: "school_emotional_abuse", abuseType:"school_emotional_abuse", abuseSource:"teacher"
      };
      saveAlertToAdmin(inputText, 85, "ORANGE", forced.reasons, "school_emotional_abuse", "school_emotional_abuse", "teacher");
      setAnalysis(forced);
      setHistory(h => [...h, forced].slice(-20));
      try { saveAnalysis(forced); } catch {}
      saveToBackend(forced);
      setInputText("");
      setLoading(false);
      return;
    }

    let result;
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token? `Bearer ${token}` : "" },
        body: JSON.stringify({
          text: inputText,
          message: inputText,
          userId: user?._id || user?.id || localStorage.getItem('userId') || `user_${Date.now()}`,
          userEmail: user?.email
        })
      });
      if (res.ok) {
        const data = await res.json();
        let riskUpper = (data.risk || data.riskLevel || "GREEN").toUpperCase();
        const confidence = data.confidence || data.score || 75;
        if (confidence < 60 && riskUpper === "RED") {
          riskUpper = "ORANGE";
          console.log("Low confidence RED downgraded to ORANGE");
        }
        let fixedSentiment = "positive";
        if (riskUpper === "RED") fixedSentiment = "needs support";
        else if (riskUpper === "ORANGE") fixedSentiment = "distressed";
        else fixedSentiment = "positive";

        // FIX: Advice like earlier - use backend reason/reply
        let backendAdvice = data.reply || data.reason || "";
        if (!backendAdvice || backendAdvice.toLowerCase().includes("error")) {
          backendAdvice = getAdvice(riskUpper, data.category || data.abuseType);
        }

        result = {
          riskLevel: riskUpper,
          score: data.score || 50,
          emotion: data.emotion || (riskUpper === "GREEN"? "neutral" : data.category === "school_emotional_abuse"?"humiliated":"stressed"),
          sentiment: fixedSentiment,
          reasons: (data.triggers || data.reasons || ["general"]).filter(t=> t!=="error"), // FIX error trigger
          advice: backendAdvice,
          source: data.isAI? "gemini-backend" : "backend-safety",
          confidence: confidence,
          isAI: data.isAI!== false,
          category: data.category || (data.abuseType?.includes("school")? "school_emotional_abuse" : data.triggers?.includes("emotional_abuse")? "emotional_abuse" : "general"),
          abuseType: data.abuseType || data.category || "none",
          abuseSource: data.abuseSource || (data.category === "school_emotional_abuse"?"teacher":"none")
        };
      } else {
        throw new Error("backend failed");
      }
    } catch (e) {
      console.warn("Backend analyze failed:", e.message);
      try {
        const g = await analyzeWithGemini(inputText, voiceData);
        const lvl = (g.level || "GREEN").toUpperCase();
        result = {
          riskLevel: lvl,
          score: g.score || 75,
          emotion: g.emotion || "neutral",
          sentiment: lvl === "RED"? "needs support" : lvl === "ORANGE"? "distressed" : (g.sentiment || "neutral"),
          reasons: (g.reasons || ["general"]).filter(t=> t!=="error"),
          advice: g.advice || getAdvice(lvl,"general"),
          source: "gemini-frontend",
          category: "general",
          abuseType: "none",
          abuseSource: "none",
          confidence: 70
        };
      } catch {
        const f = analyzeRisk(inputText);
        const positiveWords = ["happy", "great", "good", "awesome", "joy", "excited", "love"];
        const hasPositive = positiveWords.some(w => lower.includes(w));
        const hasNegative = ["sad", "depressed", "anxious", "alone", "tired", "upset", "angry", "hate", "lonely"].some(w => lower.includes(w));

        if (hasPositive &&!hasNegative) {
          result = { riskLevel: "GREEN", score: 82, emotion: "happy", sentiment: "positive", reasons: ["positive keywords detected"], advice: getAdvice("GREEN","general"), source: "fallback-positive", category: "general", abuseType:"none", abuseSource:"none", confidence: 65 };
        } else if (hasPositive && hasNegative) {
          result = { riskLevel: "ORANGE", score: 55, emotion: "mixed", sentiment: "mixed - needs attention", reasons: ["mixed emotions detected"], advice: getAdvice("ORANGE","general"), source: "fallback-mixed", category: "general", abuseType:"none", abuseSource:"none", confidence: 60 };
        } else {
          const lvl = (f.riskLevel || f.level || "ORANGE").toUpperCase();
          result = {...f, riskLevel: lvl, sentiment: lvl === "RED"? "needs support" : lvl === "ORANGE"? "distressed" : "positive", reasons:["general"], advice: getAdvice(lvl,"general"), source: "fallback", category: "general", abuseType:"none", abuseSource:"none", confidence: 50 };
        }
      }
    }

    if (result.riskLevel === "RED" || result.riskLevel === "ORANGE") {
      saveAlertToAdmin(inputText, result.score, result.riskLevel, result.reasons, result.category, result.abuseType, result.abuseSource);
    }

    const withTime = {
  ...result,
      counseling: getCounselingAdvice(inputText, result.emotion, result.riskLevel),
      topEmotions: getTopEmotions(inputText),
      voiceTone: voiceData,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      text: inputText
    };

    setAnalysis(withTime);
    setHistory(h => {
      const newH = [...h, withTime].slice(-20);
      try { localStorage.setItem('emovra_history', JSON.stringify(newH)); } catch {}
      return newH;
    });
    try { saveAnalysis(withTime); } catch {}
    saveToBackend(withTime);
    setInputText("");
    setLoading(false);
  }

  if (!user) {
    return (
      <>
        <Auth onAuth={setUser} onLogin={setUser} />
        <LegalCookieBanner />
      </>
    );
  }

  const advice = analysis?.advice || getAdvice(analysis?.riskLevel, analysis?.category);
  const counselingArray = Array.isArray(analysis?.counseling)? analysis.counseling : [];
  const isAdmin = user.role === "admin";

  return (
    <>
      <style>{`
        :root{ --bg:#0a0a0c!important; --card-bg:rgba(18,18,20,0.95)!important; --border:rgba(212,197,160,0.18)!important; --text:#e8dcc6!important; }
        body{background:#0a0a0c!important; color:#e8dcc6!important}
        div[style*="var(--card-bg)"], div[style*="var(--bg)"]{ background: rgba(18,18,20,0.95)!important; border: 0.5px solid rgba(212,197,160,0.18)!important; color:#e8dcc6!important; }
        button[style*="linear-gradient"], button[style*="#8b5cf6"], button[style*="#7c3aed"], button[style*="#a855f7"]{ background:#d4b07a!important; color:#000!important; border:none!important; }
        button{font-family:Inter,sans-serif}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#0a0a0c', color:'#e8dcc6' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 20px", maxWidth: 900, margin: "0 auto", position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,12,0.95)", backdropFilter:'blur(20px)', borderBottom: "0.5px solid rgba(212,197,160,0.15)" }}>
          <div onClick={() => navigate("/")} style={{ fontWeight: 800, fontSize: 18, color: "#d4c5a0", letterSpacing:'0.15em', cursor: "pointer" }}>EMOVRA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color:'#e8dcc6', opacity:0.7 }}>Hi, {user.name} {isAdmin && "👑"}</span>
            {isAdmin && (<button onClick={() => navigate("/admin")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "rgba(212,197,160,0.12)", color: "#d4c5a0", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Admin</button>)}
            <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "#141416", color: "#d4c5a0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Logout</button>
          </div>
        </div>

        <main id="main-content" style={{ maxWidth: 720, margin: "18px auto", padding: "0 16px" }}>

          {/* --- NEW: PHONE OTP VERIFICATION CARD - RANDOM EVERY TIME --- */}
          {!phoneVerified && (
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(212,197,160,0.3)", background: "rgba(18,18,20,0.95)", marginBottom: 16 }}>
              <b style={{ color: "#d4c5a0", fontSize: 13 }}>📱 Verify Phone Number</b>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="10 digit phone number"
                  style={{ flex: 1, minWidth: 160, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.2)", background: "#0f0f11", color: "#e8dcc6" }}
                />
                <button onClick={sendOtp} disabled={otpLoading} style={{ padding: "10px 16px", borderRadius: 8, background: "#d4b07a", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                  {otpLoading? "..." : otpSent? "Resend OTP (Random)" : "Send OTP"}
                </button>
              </div>
              {otpSent && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.2)", background: "#0f0f11", color: "#e8dcc6" }}
                  />
                  <button onClick={verifyOtp} disabled={otpLoading} style={{ padding: "10px 16px", borderRadius: 8, background: "#22c55e", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                    Verify
                  </button>
                </div>
              )}
              {otpMessage && <div style={{ marginTop: 8, fontSize: 11, color: phoneVerified? "#22c55e" : "#d4c5a0" }}>{otpMessage}</div>}
            </div>
          )}

          <div style={{ padding: 20, borderRadius: 16, border: "0.5px solid rgba(212,197,160,0.18)", background: "rgba(18,18,20,0.95)" }}>
            <h3 style={{ margin: "0 0 12px 0", color:'#e8dcc6' }}>How are you feeling today?</h3>
            <textarea rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); handleAnalyze(); } }} placeholder="Type what's on your mind..." style={{ width: "100%", padding: 14, borderRadius: 12, border: "0.5px solid rgba(212,197,160,0.18)", background: "#0f0f11", color: "#e8dcc6", outline:'none' }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap:'wrap' }}>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: "10px 18px", borderRadius: 999, border: "none", background: "#d4b07a", color: "#000", fontWeight: 800, cursor:'pointer', fontSize:12 }}>{loading? "Analyzing..." : "✨ Analyze"}</button>
              <button onClick={() => (listening? stopListening() : startListening())} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background:'transparent', color:'#d4c5a0', cursor:'pointer', fontSize:12 }}>🎙 {listening? "Stop" : "Speak"}</button>
              <button onClick={() => { setInputText(""); setAnalysis(null); }} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.12)", background:'transparent', color:'rgba(232,220,198,0.6)', cursor:'pointer', fontSize:12 }}>Clear</button>
            </div>
          </div>

          {analysis && (
            <div style={{ marginTop: 16 }}>
              {analysis.riskLevel === "RED" && (
                <div style={{ padding: 20, background: "rgba(212,197,160,0.12)", border: "1px solid rgba(212,197,160,0.3)", borderRadius: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>🫂</span>
                    <b style={{ color: "#d4c5a0", fontSize: 16 }}>We are here for you</b>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(232,220,198,0.85)', lineHeight: 1.5 }}>
                    We noticed you're going through a tough time. You are not alone. Talking to someone can help — it's confidential and free.
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <a href="tel:14416" style={{ padding: "12px 18px", background: "#d4c5a0", color: "#000", borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 13 }}>💛 Call Tele-MANAS 14416</a>
                    {user.emergencyPhone && (
                      <a href={`tel:${user.emergencyPhone}`} style={{ padding: "12px 18px", background: "rgba(255,255,255,0.08)", color: "#e8dcc6", border: "0.5px solid rgba(212,197,160,0.2)", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                        📞 Call Your SOS: {user.emergencyPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {analysis.riskLevel === "ORANGE" && (
                <div style={{ padding: 16, background: analysis.category === "school_emotional_abuse"? "rgba(251,146,60,0.15)" : "rgba(234,88,12,0.08)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 12, color: "#fb923c", marginBottom: 12 }}>
                  <b>{analysis.category === "school_emotional_abuse"? "🏫 School Emotional Abuse Detected - ORANGE" : "⚠ ORANGE - Moderate Stress"}</b>
                  <div style={{ fontSize: 13, marginTop: 6, color:'rgba(255,255,255,0.7)' }}>
                    {analysis.category === "school_emotional_abuse"? `Teacher remark: ${analysis.reasons?.join(", ")} | AbuseType: ${analysis.abuseType}` : "Stress/anxiety detected. Take a break, try grounding exercises below."}
                  </div>
                </div>
              )}
              <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:8 }}>
                <RiskCard analysis={analysis} text={analysis.text} />
                <Suspense fallback={<Loader />}><MoodChart history={history.length? history : [analysis]} /></Suspense>
              </div>
              <div style={{ marginTop: 12, padding: 14, border: "0.5px solid rgba(212,197,160,0.18)", borderRadius: 12, background: "rgba(18,18,20,0.9)", color: "#e8dcc6", fontSize:13 }}><b style={{ color:'#d4c5a0' }}>Advice:</b> {advice}</div>
              {counselingArray.length > 0 && (<div style={{ marginTop: 12 }}><h4 style={{ color:'#d4c5a0' }}>Solutions</h4>{counselingArray.map((c, i) => (<div key={i} style={{ padding: 12, border: "0.5px solid rgba(212,197,160,0.15)", background:'rgba(18,18,20,0.9)', borderRadius: 10, marginTop: 8, fontSize:13 }}><b style={{ color:'#d4c5a0' }}>{c.technique}</b><p style={{ margin:'6px 0 0 0', color:'rgba(232,220,198,0.7)' }}>{c.advice}</p></div>))}</div>)}
            </div>
          )}

          <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:16 }}>
            <Suspense fallback={<Loader />}>
              <VoiceToneAnalyzer token={token} onResult={setVoiceData} />
              <MoodTracker />
              <Journal />
              <GroundingExercises />
              <TeleManas />
            </Suspense>
          </div>

          <div style={{ marginTop: 20, padding: '16px', textAlign: 'center', fontSize: '11px', color: 'rgba(232,220,198,0.4)', borderTop: '0.5px solid rgba(212,197,160,0.12)' }}>
            <span style={{ color:'#d4c5a0', letterSpacing:'0.15em', fontWeight:700 }}>EMOVRA</span> - Wellness support only • Not a medical diagnosis. Call 14416 in crisis.
          </div>
        </main>
        <LegalCookieBanner />
      </div>
    </>
  );
}
