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
import OnboardingWalkthrough from "../components/OnboardingWalkthrough.jsx"; // NEW
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
  // NOTE: phone "Verify Phone Number" OTP state was removed - that
  // feature never sent real SMS (no gateway wired up), so it wasn't
  // providing any real verification. See routes/auth.js for the
  // replacement: forgot-password now uses real email OTP instead.

  const token = localStorage.getItem('token');
  const { transcript, listening, error: micError, startListening, stopListening } = useSpeechRecognition();
  const [avatarProfile, setAvatarProfile] = useState({ avatar: "🦋", avatarType: "emoji", avatarImage: "" }); // NEW
  // NEW: safety plan - fetched once, passed to RiskCard so it can show a
  // reminder of the person's own reasons/coping strategies during RED
  const [safetyPlan, setSafetyPlan] = useState(null);
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/safety-plan`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.plan) setSafetyPlan(d.plan); })
      .catch(() => {});
  }, [token]);
  // NEW: soft email verification banner state
  const [emailVerified, setEmailVerified] = useState(() => !!user?.emailVerified);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  async function resendVerifyEmail() {
    setVerifyLoading(true);
    setVerifyMsg("");
    try {
      const res = await fetch(`${API}/auth/verify-email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      setVerifyMsg(data.devMode ? `Email sending isn't set up yet - your code is ${data.otp}` : (data.message || "Code sent - check your inbox."));
      setVerifyOpen(true);
    } catch {
      setVerifyMsg("Could not send code - try again.");
    }
    setVerifyLoading(false);
  }

  async function confirmVerifyEmail() {
    if (!verifyCode.trim()) { setVerifyMsg("Enter the code."); return; }
    setVerifyLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-email/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, otp: verifyCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(true);
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setVerifyMsg(data.msg || "Invalid code.");
      }
    } catch {
      setVerifyMsg("Something went wrong - try again.");
    }
    setVerifyLoading(false);
  }

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setAvatarProfile({ avatar: d.avatar, avatarType: d.avatarType, avatarImage: d.avatarImage }); })
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
  .then(d => {
    if (!Array.isArray(d) || !d.length) return;
    // Merge server entries (RED/ORANGE only, by design) into the existing
    // local history instead of replacing it - the local history includes
    // GREEN/YELLOW moods that were never sent to the server, and blindly
    // overwriting with server-only data was silently discarding those on
    // every page load, which is the exact bug this fixes.
    setHistory(h => {
      const existingKeys = new Set(h.map(e => `${e.text}|${e.timestamp}`));
      const merged = [...h];
      for (const entry of d) {
        const key = `${entry.text}|${entry.timestamp}`;
        if (!existingKeys.has(key)) merged.push(entry);
      }
      merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return merged.slice(-20);
    });
  })
  .catch(() => {});
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    try { localStorage.setItem('emovra_history', JSON.stringify(history)); } catch {}
  }, [history]);

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
          phone: user?.emergencyPhone || user?.phone || "",
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

  // TEMPORARILY DISABLED (see mailer.js / server logs) - verification
  // emails currently can't reliably reach anyone but the sender, since
  // Brevo + a free Gmail sender address gets rejected by Gmail's own
  // anti-spoofing protections. Blocking signup behind a step that can't
  // structurally complete right now would lock every real user out.
  // Re-enable by changing this back to `if (!emailVerified)` once a real
  // domain is authenticated with Brevo - everything else (the gate UI,
  // send/confirm functions, backend routes) is untouched and ready to go.
  if (false && !emailVerified) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 420, width: "100%", background: "var(--card-bg, #16161a)", borderRadius: 20, padding: 32, border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>📧</div>
          <h2 style={{ color: "var(--text-h)", marginTop: 10 }}>Verify your email</h2>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8, lineHeight: 1.6 }}>
            One last step before you get started - this happens right after signup. We'll send a code to <b>{user.email}</b>.
          </p>

          {!verifyOpen ? (
            <button onClick={resendVerifyEmail} disabled={verifyLoading} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
              {verifyLoading ? "Sending..." : "Send verification code"}
            </button>
          ) : (
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--text-h)", marginBottom: 4 }}>{verifyMsg}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>Don't see it? Check your spam/junk folder too - the code can end up there.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="6-digit code" style={{ flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.2)", background: "#0f0f11", color: "var(--text)" }} />
                <button onClick={confirmVerifyEmail} disabled={verifyLoading} style={{ padding: "10px 18px", borderRadius: 8, background: "#22c55e", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 }}>
                  Confirm
                </button>
              </div>
              <button onClick={resendVerifyEmail} disabled={verifyLoading} style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(212,197,160,0.2)", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>
                Resend code
              </button>
            </div>
          )}

          <button onClick={handleLogout} style={{ marginTop: 20, display: "block", width: "100%", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  const advice = analysis?.advice || getAdvice(analysis?.riskLevel, analysis?.category);
  const counselingArray = Array.isArray(analysis?.counseling)? analysis.counseling : [];
  const isAdmin = user.role === "admin";

  return (
    <>
      <OnboardingWalkthrough />
      <style>{`
        body{background:var(--bg)!important; color:var(--text)!important}
        button[style*="linear-gradient"], button[style*="#8b5cf6"], button[style*="#7c3aed"], button[style*="#a855f7"]{ background:var(--accent)!important; color:#000!important; border:none!important; }
        button{font-family:Inter,sans-serif}
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,12,1)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 20px", maxWidth: 900, margin: "0 auto", borderBottom: "0.5px solid rgba(212,197,160,0.15)" }}>
          <div onClick={() => navigate("/")} style={{ fontWeight: 800, fontSize: 18, color: "var(--text-h)", letterSpacing:'0.15em', cursor: "pointer" }}>EMOVRA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* NEW: quick link back to the personalized dashboard */}
            <button onClick={() => navigate("/dashboard")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "transparent", color: "var(--text-h)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>📊 Dashboard</button>
            {avatarProfile.avatarType === "custom" && avatarProfile.avatarImage
              ? <img src={avatarProfile.avatarImage} alt="avatar" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 20 }}>{avatarProfile.avatar}</span>}
            <span style={{ fontSize: 12, color:'var(--text)', opacity:0.7 }}>Hi, {user.name} {isAdmin && "👑"}</span>
            {isAdmin && (<button onClick={() => navigate("/admin")} style={{ padding: "6px 12px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "rgba(212,197,160,0.12)", color: "var(--text-h)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Admin</button>)}
            <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background: "#141416", color: "var(--text-h)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Logout</button>
          </div>
        </div>

        {/* NEW: tab bar - organizes everything that used to be one long
            stacked page. Nothing below was removed, just grouped. */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "10px 16px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
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
        </div>

        <main id="main-content" style={{ maxWidth: 720, margin: "18px auto", padding: "0 16px" }}>

          {tab === "checkin" && (
            <>

              <div style={{ padding: 20, borderRadius: 16, border: "0.5px solid rgba(212,197,160,0.18)", background: "var(--card-bg)" }}>
                <h3 style={{ margin: "0 0 12px 0", color:'var(--text)' }}>How are you feeling today?</h3>
                <textarea rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); handleAnalyze(); } }} placeholder="Type what's on your mind..." style={{ width: "100%", padding: 14, borderRadius: 12, border: "0.5px solid rgba(212,197,160,0.18)", background: "#0f0f11", color: "var(--text)", outline:'none' }} />
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap:'wrap', alignItems: 'center' }}>
                  <button onClick={handleAnalyze} disabled={loading} style={{ padding: "10px 18px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontSize:12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {loading && <span style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "emovra-spin 0.7s linear infinite" }} />}
                    {loading? "Analyzing..." : "✨ Analyze"}
                  </button>
                  {loading && <span style={{ fontSize: 11, opacity: 0.5 }}>This can take up to 15 seconds</span>}
                  <button onClick={() => (listening? stopListening() : startListening())} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(212,197,160,0.3)", background:'transparent', color:'var(--text-h)', cursor:'pointer', fontSize:12 }}>🎙 {listening? "Stop" : "Speak"}</button>
                  <button onClick={() => { setInputText(""); setAnalysis(null); }} style={{ padding: "10px 18px", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.12)", background:'transparent', color:'rgba(232,220,198,0.6)', cursor:'pointer', fontSize:12 }}>Clear</button>
                </div>
                {micError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 8, borderRadius: 8, fontSize: 12, marginTop: 10 }}>{micError}</div>}
              </div>

              {analysis && (
                <div style={{ marginTop: 16 }}>
                  {/* FIX: this used to have two entire legacy risk-display
                      blocks here (one for RED, one for ORANGE) from before
                      RiskCard.jsx was redesigned - they were never removed,
                      so they rendered ABOVE the new RiskCard, duplicating
                      it and leaking raw badge text like "ORANGE - Moderate
                      Stress" that the redesign was specifically meant to
                      eliminate. The RED block's SOS-call-your-own-contact
                      button was real, useful functionality though - moved
                      into RiskCard.jsx itself instead of deleted. */}
                  <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:8 }}>
                    <RiskCard analysis={analysis} text={analysis.text} userName={user.name} emergencyPhone={user.emergencyPhone} safetyPlan={safetyPlan} />
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
