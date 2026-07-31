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

// NEW: this round's features, all lazy-loaded the same way as the rest
// NEW: only the chatbot lives in the main app now - habit tracker, goals,
// insights, calendar, sleep, creative corner, music therapy, quiz, and
// theme settings all moved to Dashboard.jsx per your request.
const Chatbot = lazy(() => import("../components/Chatbot"));

const API = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

function getAdvice(level, category) {
  const lvl = String(level || "").toUpperCase();
  if (category === "school_emotional_abuse") return "It's painful when words from a teacher hurt in front of class. Your worth isn't defined by one remark. Try 5-4-3-2-1 grounding and consider talking to a counselor you trust. You are not alone. 💛";
  if (lvl === "GREEN") return "You're in a stable range. Maintain healthy habits. Keep smiling! 😊";
  if (lvl === "ORANGE" || lvl === "YELLOW") return "Moderate stress detected. Please talk to a trusted friend or counselor. Try Box Breathing 4-4-4-4.";
  return "You matter. You are not alone. Help is available if you need it.";
}

const Loader = () => <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-h)', fontSize: 11 }}>Loading...</div>;

// NEW: sections, organized instead of one endless stack of 20 components.
// Nothing here was removed - everything that used to be on the page still
// is, just grouped under tabs so it's actually navigable.
// NEW: only the original features + AI chat live here now. Habits &
// Goals, Insights, Wellness Tools, and Settings moved to Dashboard.jsx.
const TABS = [
  { id: "checkin", label: "Check-in" },
  { id: "voice-mood", label: "Voice & Mood" },
  { id: "journal", label: "Journal" },
  { id: "wellness", label: "Grounding & Support" },
  { id: "chat", label: "Talk to AI" },
];

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
  const [tab, setTab] = useState("checkin"); // NEW
  const [history, setHistory] = useState(() => {
    try {
      const s = localStorage.getItem('emovra_history');
      return s? JSON.parse(s) : [];
    } catch { return []; }
  });

  // --- OTP PHONE VERIFICATION STATES ---
  const [phoneInput, setPhoneInput] = useState(() => user?.phone || "");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(() =>!!user?.phoneVerified ||!!user?.phone);
  const [otpMessage, setOtpMessage] = useState("");

  const token = localStorage.getItem('token');
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  const [avatar, setAvatar] = useState("🦋"); // NEW

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success && d.avatar) setAvatar(d.avatar); })
      .catch(() => {});
  }, [token]);

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

  // --- OTP FUNCTIONS - RANDOM EVERY TIME ---
  async function sendOtp() {
    if (!phoneInput || phoneInput.length < 10) {
      setOtpMessage("Enter valid 10 digit phone");
      return;
    }
    setOtpLoading(true);
    setOtpMessage("");
    try {
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
    // PRIVACY: Only RED/ORANGE to backend, GREEN/YELLOW only local
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
    // alerts = ONLY emotional abuse in classrooms
    if (category!== "school_emotional_abuse") {
      console.log(`Skipped alerts - category is ${category}, only school_emotional_abuse allowed`);
      return;
    }
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
    const schoolAbuseKeys = ["teacher said i am useless", "teacher insulted", "teacher beizzati", "sir ne daanta", "ma'am ne beizzati", "teacher targets me", "teacher says i will fail", "teacher makes fun", "teacher compares", "teacher always shouts", "nikamma bola", "nalayak bola teacher", "sabke samne daanta", "class me beizzati", "teacher said worthless"];

    const wantsToDie = lower.includes("i want to die") || lower.includes("mujhe marna hai") || lower.includes("marna hai mujhe");
    const isAbuseLocal = abuseKeys.some(k => lower.includes(k));
    const isSchoolAbuseLocal = schoolAbuseKeys.some(k => rawLower.includes(k)) || /teacher.*(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|beizzati|daanta)/i.test(rawLower);

    // NOTE on the three branches below (wantsToDie / redKeys / isSchoolAbuseLocal):
    // these are computed entirely client-side and NEVER reach the backend's
    // /api/analyze (which has its own, server-side saving via saveAnalysis()).
    // So calling saveToBackend()/saveAlertToAdmin() here is correct and NOT
    // redundant - this is the only place these particular messages get saved
    // at all.

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
    let alreadySavedServerSide = false; // NEW - see the fix note below

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
        // FIX: /api/analyze already saves RED/ORANGE server-side (see
        // backend utils/saveAnalysis.js, called from inside that route).
        // Previously this file ALSO called saveToBackend()/saveAlertToAdmin()
        // below for every result regardless of source, which meant a
        // message that went through this branch got saved TWICE - once by
        // the backend automatically, once again by this file explicitly.
        // Marking it here so we skip the redundant client-side save later.
        alreadySavedServerSide = true;

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

        let backendAdvice = data.reply || data.reason || "";
        if (!backendAdvice || backendAdvice.toLowerCase().includes("error")) {
          backendAdvice = getAdvice(riskUpper, data.category || data.abuseType);
        }

        result = {
          riskLevel: riskUpper,
          score: data.score || 50,
          emotion: data.emotion || (riskUpper === "GREEN"? "neutral" : data.category === "school_emotional_abuse"?"humiliated":"stressed"),
          sentiment: fixedSentiment,
          reasons: (data.triggers || data.reasons || ["general"]).filter(t=> t!=="error"),
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
      // NOTE: everything in this catch block (Gemini-frontend, and the
      // final keyword fallback) never reached the backend at all, so
      // alreadySavedServerSide correctly stays false - these DO still need
      // the explicit saveToBackend()/saveAlertToAdmin() calls below.
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

    // FIX: only save here when the result did NOT already get saved
    // server-side inside /api/analyze (see alreadySavedServerSide above).
    if (!alreadySavedServerSide) {
      if (result.riskLevel === "RED" || result.riskLevel === "ORANGE") {
        saveAlertToAdmin(inputText, result.score, result.riskLevel, result.reasons, result.category, result.abuseType, result.abuseSource);
      }
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
    if (!alreadySavedServerSide) {
      saveToBackend(withTime); // FIX: skipped when /api/analyze already saved it
    }
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
        body{background:var(--bg)!important; color:var(--text)!important}
        div[style*="var(--card-bg)"], div[style*="var(--bg)"]{ background: var(--card-bg)!important; border: 0.5px solid rgba(212,197,160,0.18)!important; color:var(--text)!important; }
        button[style*="linear-gradient"], button[style*="#8b5cf6"], button[style*="#7c3aed"], button[style*="#a855f7"]{ background:var(--accent)!important; color:#000!important; border:none!important; }
        button{font-family:Inter,sans-serif}
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 20px", maxWidth: 900, margin: "0 auto", position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,12,0.95)", backdropFilter:'blur(20px)', borderBottom: "0.5px solid rgba(212,197,160,0.15)" }}>
          <div onClick={() => navigate("/")} style={{ fontWeight: 800, fontSize: 18, color: "var(--text-h)", letterSpacing:'0.15em', cursor: "pointer" }}>EMOVRA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* NEW: quick link back to the personalized dashboard */}
            <button onClick={() => navigate("/dashboard")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "transparent", color: "var(--text-h)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>📊 Dashboard</button>
            <span style={{ fontSize: 20 }}>{avatar}</span>
            <span style={{ fontSize: 12, color:'var(--text)', opacity:0.7 }}>Hi, {user.name} {isAdmin && "👑"}</span>
            {isAdmin && (<button onClick={() => navigate("/admin")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "rgba(212,197,160,0.12)", color: "var(--text-h)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Admin</button>)}
            <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "#141416", color: "var(--text-h)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Logout</button>
          </div>
        </div>

        {/* NEW: tab bar - organizes everything that used to be one long
            stacked page. Nothing below was removed, just grouped. */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "10px 16px 0", display: "flex", gap: 6, flexWrap: "wrap", position: "sticky", top: 64, zIndex: 90, background: "rgba(10,10,12,0.95)", backdropFilter: "blur(20px)" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: tab === t.id ? "1px solid var(--accent)" : "0.5px solid rgba(212,197,160,0.2)",
              background: tab === t.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: tab === t.id ? "var(--text-h)" : "rgba(232,220,198,0.6)",
              fontWeight: tab === t.id ? 700 : 500,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <main id="main-content" style={{ maxWidth: 720, margin: "18px auto", padding: "0 16px" }}>

          {tab === "checkin" && (
            <>
              {!phoneVerified && (
                <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(212,197,160,0.3)", background: "var(--card-bg)", marginBottom: 16 }}>
                  <b style={{ color: "var(--text-h)", fontSize: 13 }}>📱 Verify Phone Number</b>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="10 digit phone number"
                      style={{ flex: 1, minWidth: 160, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.2)", background: "#0f0f11", color: "var(--text)" }}
                    />
                    <button onClick={sendOtp} disabled={otpLoading} style={{ padding: "10px 16px", borderRadius: 8, background: "var(--accent)", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                      {otpLoading? "..." : otpSent? "Resend OTP (Random)" : "Send OTP"}
                    </button>
                  </div>
                  {otpSent && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <input
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.2)", background: "#0f0f11", color: "var(--text)" }}
                      />
                      <button onClick={verifyOtp} disabled={otpLoading} style={{ padding: "10px 16px", borderRadius: 8, background: "#22c55e", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                        Verify
                      </button>
                    </div>
                  )}
                  {otpMessage && <div style={{ marginTop: 8, fontSize: 11, color: phoneVerified? "#22c55e" : "var(--text-h)" }}>{otpMessage}</div>}
                </div>
              )}

              <div style={{ padding: 20, borderRadius: 16, border: "0.5px solid rgba(212,197,160,0.18)", background: "var(--card-bg)" }}>
                <h3 style={{ margin: "0 0 12px 0", color:'var(--text)' }}>How are you feeling today?</h3>
                <textarea rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); handleAnalyze(); } }} placeholder="Type what's on your mind..." style={{ width: "100%", padding: 14, borderRadius: 12, border: "0.5px solid rgba(212,197,160,0.18)", background: "#0f0f11", color: "var(--text)", outline:'none' }} />
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap:'wrap' }}>
                  <button onClick={handleAnalyze} disabled={loading} style={{ padding: "10px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 800, cursor:'pointer', fontSize:12 }}>{loading? "Analyzing..." : "✨ Analyze"}</button>
                  <button onClick={() => (listening? stopListening() : startListening())} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background:'transparent', color:'var(--text-h)', cursor:'pointer', fontSize:12 }}>🎙 {listening? "Stop" : "Speak"}</button>
                  <button onClick={() => { setInputText(""); setAnalysis(null); }} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.12)", background:'transparent', color:'rgba(232,220,198,0.6)', cursor:'pointer', fontSize:12 }}>Clear</button>
                </div>
              </div>

              {analysis && (
                <div style={{ marginTop: 16 }}>
                  {analysis.riskLevel === "RED" && (
                    <div style={{ padding: 20, background: "rgba(212,197,160,0.12)", border: "1px solid rgba(212,197,160,0.3)", borderRadius: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>🫂</span>
                        <b style={{ color: "var(--text-h)", fontSize: 16 }}>We are here for you</b>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(232,220,198,0.85)', lineHeight: 1.5 }}>
                        We noticed you're going through a tough time. You are not alone. Talking to someone can help — it's confidential and free.
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                        <a href="tel:14416" style={{ padding: "12px 18px", background: "var(--text-h)", color: "#000", borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 13 }}>💛 Call Tele-MANAS 14416</a>
                        {user.emergencyPhone && (
                          <a href={`tel:${user.emergencyPhone}`} style={{ padding: "12px 18px", background: "rgba(255,255,255,0.08)", color: "var(--text)", border: "0.5px solid rgba(212,197,160,0.2)", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
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
                    <RiskCard analysis={analysis} text={analysis.text} userName={user.name} />
                    <Suspense fallback={<Loader />}><MoodChart history={history.length? history : [analysis]} /></Suspense>
                  </div>
                  <div style={{ marginTop: 12, padding: 14, border: "0.5px solid rgba(212,197,160,0.18)", borderRadius: 12, background: "rgba(18,18,20,0.9)", color: "var(--text)", fontSize:13 }}><b style={{ color:'var(--text-h)' }}>Advice:</b> {advice}</div>
                  {counselingArray.length > 0 && (<div style={{ marginTop: 12 }}><h4 style={{ color:'var(--text-h)' }}>Solutions</h4>{counselingArray.map((c, i) => (<div key={i} style={{ padding: 12, border: "0.5px solid rgba(212,197,160,0.15)", background:'rgba(18,18,20,0.9)', borderRadius: 10, marginTop: 8, fontSize:13 }}><b style={{ color:'var(--text-h)' }}>{c.technique}</b><p style={{ margin:'6px 0 0 0', color:'rgba(232,220,198,0.7)' }}>{c.advice}</p></div>))}</div>)}
                </div>
              )}
            </>
          )}

          {tab === "voice-mood" && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Suspense fallback={<Loader />}>
                <VoiceToneAnalyzer token={token} onResult={setVoiceData} />
                <MoodTracker />
              </Suspense>
            </div>
          )}

          {tab === "journal" && (
            <Suspense fallback={<Loader />}><Journal /></Suspense>
          )}

          {tab === "wellness" && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Suspense fallback={<Loader />}>
                <GroundingExercises />
                <TeleManas />
              </Suspense>
            </div>
          )}

          {tab === "chat" && (
            <Suspense fallback={<Loader />}><Chatbot /></Suspense>
          )}

          <div style={{ marginTop: 20, padding: '16px', textAlign: 'center', fontSize: '11px', color: 'rgba(232,220,198,0.4)', borderTop: '0.5px solid rgba(212,197,160,0.12)' }}>
            <span style={{ color:'var(--text-h)', letterSpacing:'0.15em', fontWeight:700 }}>EMOVRA</span> - Wellness support only • Not a medical diagnosis. Call 14416 in crisis.
          </div>
        </main>
        <LegalCookieBanner />
      </div>
    </>
  );
}
