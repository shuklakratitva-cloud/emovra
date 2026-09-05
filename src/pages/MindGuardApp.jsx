import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import RiskCard from "../components/RiskCard";
import MoodTracker from "../components/MoodTracker";
import { getCounselingAdvice, getTopEmotions } from "../utils/counselor.js";
import { saveAnalysis, loadAnalysis, clearAppStorage } from "../utils/storage";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { analyzeWithGemini } from "../utils/geminiAnalyzer.js";
import { analyzeRisk } from "../utils/analyzeRisk.js";
import Auth from "../components/Auth.jsx";
import OnboardingWalkthrough from "../components/OnboardingWalkthrough.jsx";
import LegalCookieBanner from "../components/LegalCookieBanner.jsx";
import "../App.css";

const MoodChart = lazy(() => import("../components/MoodChart"));
const Journal = lazy(() => import("../components/Journal"));
const GroundingExercises = lazy(() => import("../components/GroundingExercises"));
const TeleManas = lazy(() => import("../components/TeleManas"));
const VoiceToneAnalyzer = lazy(() => import("../components/VoiceToneAnalyzer.jsx"));

const Chatbot = lazy(() => import("../components/Chatbot"));

import { API_BASE as API } from "../config/api.js";

function getAdvice(t, level, category) {
  const lvl = String(level || "").toUpperCase();
  if (category === "school_emotional_abuse") return t("checkin.adviceSchoolAbuse");
  if (lvl === "GREEN") return t("checkin.adviceGreen");
  if (lvl === "ORANGE" || lvl === "YELLOW") return t("checkin.adviceOrange");
  return t("checkin.adviceDefault");
}

const Loader = () => {
  const { t } = useLanguage();
  return (
    <div style={{ padding: 12, textAlign: "center", color: "var(--text-h)", fontSize: 11 }}>
      {t("dashboard.loading")}
    </div>
  );
};

const TABS = [
  { id: "checkin", labelKey: "apptab.checkin" },
  { id: "voice-mood", labelKey: "apptab.voiceMood" },
  { id: "journal", labelKey: "apptab.journal" },
  { id: "wellness", labelKey: "apptab.wellness" },
  { id: "chat", labelKey: "apptab.chat" },
];

export default function MindGuardApp() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [voiceData, setVoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("checkin");
  const [history, setHistory] = useState(() => {
    try {
      const s = localStorage.getItem("emovra_history");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const token = localStorage.getItem("token");
  const {
    transcript,
    listening,
    error: micError,
    startListening,
    stopListening,
  } = useSpeechRecognition();
  const [avatarProfile, setAvatarProfile] = useState({
    avatar: "🦋",
    avatarType: "emoji",
    avatarImage: "",
  }); // NEW
  // NEW: safety plan - fetched once, passed to RiskCard so it can show a
  // reminder of the person's own reasons/coping strategies during RED
  const [safetyPlan, setSafetyPlan] = useState(null);
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/safety-plan`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.plan) setSafetyPlan(d.plan);
      })
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
      setVerifyMsg(
        data.devMode
          ? `Email sending isn't set up yet - your code is ${data.otp}`
          : data.message || "Code sent - check your inbox."
      );
      setVerifyOpen(true);
    } catch {
      setVerifyMsg("Could not send code - try again.");
    }
    setVerifyLoading(false);
  }

  async function confirmVerifyEmail() {
    if (!verifyCode.trim()) {
      setVerifyMsg("Enter the code.");
      return;
    }
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
      .then((r) => r.json())
      .then((d) => {
        if (d.success)
          setAvatarProfile({
            avatar: d.avatar,
            avatarType: d.avatarType,
            avatarImage: d.avatarImage,
          });
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${API.replace("/api", "")}/health`).catch(() => {});
      fetch(`${API}/health`).catch(() => {});
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  useEffect(() => {
    try {
      const old = loadAnalysis();
      if (old && old.text) setAnalysis(old);
      if (token) {
        fetch(`${API}/data/my`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => {
            if (!r.ok) throw new Error("no data");
            return r.json();
          })
          .then((d) => {
            if (!Array.isArray(d) || !d.length) return;

            setHistory((h) => {
              const existingKeys = new Set(h.map((e) => `${e.text}|${e.timestamp}`));
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
    try {
      localStorage.setItem("emovra_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  async function saveToBackend(entry) {
    if (entry.riskLevel !== "RED" && entry.riskLevel !== "ORANGE") {
      console.log("Privacy: GREEN not saved to backend, only local");
      return;
    }
    if (!token) return;
    try {
      await fetch(`${API}/data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(entry),
      });
    } catch {}
  }

  async function saveAlertToAdmin(
    text,
    score,
    riskLevel,
    reasons,
    category,
    abuseType,
    abuseSource
  ) {
    if (category !== "school_emotional_abuse") {
      console.log(`Skipped alerts - category is ${category}, only school_emotional_abuse allowed`);
      return;
    }
    if (riskLevel !== "RED" && riskLevel !== "ORANGE") return;
    if (!token) return;
    try {
      await fetch(`${API}/alerts/red`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text,
          score,
          riskLevel,
          reasons,
          category: category || "school_emotional_abuse",
          abuseType: abuseType || "school_emotional_abuse",
          abuseSource: abuseSource || "teacher",
          phone: user?.emergencyPhone || user?.phone || "",
          userEmail: user?.email,
          userName: user?.name,
          userId: user?._id || user?.id || localStorage.getItem("userId"),
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn("Alert save failed:", e.message);
    }
  }

  // FIX: this used to only clear 'token'/'user'/'emovra_history' -
  // leaving mood history, the last risk analysis, CBT worksheets, and the
  // life timeline (all unscoped to any user id) behind in localStorage
  // indefinitely. On a shared/school/library computer, the next person to
  // open the app could read the previous student's mood/CBT/crisis-
  // analysis history after they believed they'd logged out.
  // clearAppStorage() already existed for exactly this but was never
  // called anywhere.
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAppStorage();
    setUser(null);
    navigate("/", { replace: true });
  }

  async function handleAnalyze() {
    if (!inputText.trim()) return;
    setLoading(true);

    const rawLower = inputText.toLowerCase().replace(/[‘’]/g, "'");
    const lower = rawLower.replace(/[^a-z0-9 ]/g, " ");
    // FIX: `lower` strips apostrophes AND sentence punctuation, which quietly
    // broke the negation guard below in two ways: "don't" became "don t" so
    // NEGATION_WORDS could never match the single most common contraction,
    // and CLAUSE_SPLIT's [.,!?;] branch was dead because the punctuation was
    // already gone - leaving only but/however/although/though to split on.
    // Net effect: "I definitely don't want to kill myself, just venting"
    // fired a guaranteed RED crisis alert, the exact case the comment below
    // says was fixed. Keep a separate string that preserves apostrophes and
    // sentence punctuation, and run the negation logic against that one.
    const negLower = rawLower.replace(/[^a-z0-9 '.,!?;]/g, " ");

    // FIX: hasNegation used to be checked against the WHOLE message
    // ("I don't know why, but I want to die" used to skip the guaranteed
    // local RED override entirely, since "don't" appears anywhere), and
    // redKeys below had NO negation check at all ("I definitely don't
    // want to kill myself, just venting" used to fire a guaranteed crisis
    // alert). Negation is now checked per-clause (split on sentence
    // punctuation and but/however/etc.), with the matched phrase itself
    // removed from the clause before checking - so a genuine "I don't
    // want to ___" right next to the phrase still suppresses it, an
    // unrelated negation elsewhere can't mask a real disclosure, and a
    // phrase like "nahi jeena" (an idiom, not a negated one) doesn't
    // read as negating itself.
    const NEGATION_WORDS = /\b(nahi|nahin|matlab nahi|don't|dont|do not|never|not)\b/;
    const CLAUSE_SPLIT = /[.,!?;]+|\bbut\b|\bhowever\b|\balthough\b|\bthough\b/i;
    function hasUnnegatedPhrase(text, phrases) {
      return text.split(CLAUSE_SPLIT).some((clause) => {
        const matched = phrases.find((p) => clause.includes(p));
        if (!matched) return false;
        const remainder = clause.split(matched).join(" ");
        return !NEGATION_WORDS.test(remainder);
      });
    }

    const redKeys = [
      "kill myself",
      "end my life",
      "suicide",
      "no one will know if i die",
      "want to kill",
      "slit",
      "choke",
      "mar jana hai",
      "mar jau",
      "jeena nahi hai",
      "khatam karna hai",
      "khud ko khatam",
      "khudkushi",
      "zindagi khatam",
      "marna chahta hu",
      "nahi jeena",
      "zindagi se tang",
      "i will kill him",
    ];
    const abuseKeys = [
      "beats me",
      "hits me",
      "maarta hai",
      "gaali deta",
      "abuse karta",
      "toxic relationship",
      "gaslighting",
    ];
    const schoolAbuseKeys = [
      "teacher said i am useless",
      "teacher insulted",
      "teacher beizzati",
      "sir ne daanta",
      "ma'am ne beizzati",
      "teacher targets me",
      "teacher says i will fail",
      "teacher makes fun",
      "teacher compares",
      "teacher always shouts",
      "nikamma bola",
      "nalayak bola teacher",
      "sabke samne daanta",
      "class me beizzati",
      "teacher said worthless",
    ];

    const wantsToDie = hasUnnegatedPhrase(negLower, [
      "i want to die",
      "mujhe marna hai",
      "marna hai mujhe",
    ]);
    const isAbuseLocal = abuseKeys.some((k) => lower.includes(k));
    const isSchoolAbuseLocal =
      schoolAbuseKeys.some((k) => rawLower.includes(k)) ||
      /teacher.*(useless|worthless|worst|dumb|stupid|fail|nikamma|nalayak|beizzati|daanta)/i.test(
        rawLower
      );

    if (wantsToDie) {
      const cat = isSchoolAbuseLocal
        ? "school_emotional_abuse"
        : isAbuseLocal
          ? "emotional_abuse"
          : "self_harm";
      const forced = {
        riskLevel: "RED",
        score: 98,
        emotion: "critical",
        sentiment: "needs support",
        reasons: isSchoolAbuseLocal
          ? ["teacher_remark", "public_shaming"]
          : isAbuseLocal
            ? ["critical/self-harm detected", "emotional_abuse"]
            : ["critical/self-harm detected"],
        advice: getAdvice(t, "RED", cat),
        isCrisis: true,
        text: inputText,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        counseling: getCounselingAdvice(inputText, "critical", "RED", lang),
        topEmotions: getTopEmotions(inputText),
        voiceTone: voiceData,
        isAI: false,
        isSafetyNet: true,
        category: cat,
        abuseType: cat,
        abuseSource: isSchoolAbuseLocal ? "teacher" : isAbuseLocal ? "parent" : "none",
      };
      saveAlertToAdmin(
        inputText,
        98,
        "RED",
        forced.reasons,
        cat,
        forced.abuseType,
        forced.abuseSource
      );
      setAnalysis(forced);
      setHistory((h) => [...h, forced].slice(-20));
      try {
        saveAnalysis(forced);
      } catch {}
      saveToBackend(forced);
      setInputText("");
      setLoading(false);
      return;
    }

    if (hasUnnegatedPhrase(negLower, redKeys)) {
      const forced = {
        riskLevel: "RED",
        score: 98,
        emotion: "critical",
        sentiment: "needs support",
        reasons: ["critical/self-harm detected"],
        advice: getAdvice(t, "RED", "self_harm"),
        isCrisis: true,
        text: inputText,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        counseling: getCounselingAdvice(inputText, "critical", "RED", lang),
        topEmotions: getTopEmotions(inputText),
        voiceTone: voiceData,
        category: "self_harm",
        abuseType: "none",
        abuseSource: "none",
      };
      saveAlertToAdmin(inputText, 98, "RED", forced.reasons, "self_harm", "none", "none");
      setAnalysis(forced);
      setHistory((h) => [...h, forced].slice(-20));
      try {
        saveAnalysis(forced);
      } catch {}
      saveToBackend(forced);
      setInputText("");
      setLoading(false);
      return;
    }

    if (isSchoolAbuseLocal) {
      const forced = {
        riskLevel: "ORANGE",
        score: 85,
        emotion: "humiliated",
        sentiment: "distressed",
        reasons: ["teacher_remark", "public_shaming"],
        advice: getAdvice(t, "ORANGE", "school_emotional_abuse"),
        text: inputText,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        counseling: getCounselingAdvice(inputText, "humiliated", "ORANGE", lang),
        topEmotions: getTopEmotions(inputText),
        voiceTone: voiceData,
        isAI: false,
        isSafetyNet: true,
        category: "school_emotional_abuse",
        abuseType: "school_emotional_abuse",
        abuseSource: "teacher",
      };
      saveAlertToAdmin(
        inputText,
        85,
        "ORANGE",
        forced.reasons,
        "school_emotional_abuse",
        "school_emotional_abuse",
        "teacher"
      );
      setAnalysis(forced);
      setHistory((h) => [...h, forced].slice(-20));
      try {
        saveAnalysis(forced);
      } catch {}
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
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          text: inputText,
          message: inputText,
          userId: user?._id || user?.id || localStorage.getItem("userId") || `user_${Date.now()}`,
          userEmail: user?.email,
        }),
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
          backendAdvice = getAdvice(t, riskUpper, data.category || data.abuseType);
        }

        result = {
          riskLevel: riskUpper,
          score: data.score || 50,
          emotion:
            data.emotion ||
            (riskUpper === "GREEN"
              ? "neutral"
              : data.category === "school_emotional_abuse"
                ? "humiliated"
                : "stressed"),
          sentiment: fixedSentiment,
          reasons: (data.triggers || data.reasons || ["general"]).filter((t) => t !== "error"),
          advice: backendAdvice,
          source: data.isAI ? "gemini-backend" : "backend-safety",
          confidence: confidence,
          isAI: data.isAI !== false,
          category:
            data.category ||
            (data.abuseType?.includes("school")
              ? "school_emotional_abuse"
              : data.triggers?.includes("emotional_abuse")
                ? "emotional_abuse"
                : "general"),
          abuseType: data.abuseType || data.category || "none",
          abuseSource:
            data.abuseSource || (data.category === "school_emotional_abuse" ? "teacher" : "none"),
        };
      } else {
        throw new Error("backend failed");
      }
    } catch (e) {
      console.warn("Backend analyze failed:", e.message);

      try {
        const g = await analyzeWithGemini(inputText, voiceData);
        // FIX: analyzeWithGemini() talks to /api/chat, and that route runs
        // saveAnalysis() itself - so reaching it already wrote the Entry
        // (and, for school abuse, the Alert). Without this line the code
        // below still ran saveToBackend() -> /data/save and
        // saveAlertToAdmin() -> /alerts/red, storing the SAME disclosure a
        // second time. Every RED/ORANGE check-in that fell through to this
        // fallback path (i.e. any time /api/analyze was cold-starting or
        // rate limited) was counted twice in the student's own history, in
        // the admin panel, and by the early-warning rule that escalates on
        // repeated flags - so a single message could look like a pattern.
        if (g.savedServerSide) alreadySavedServerSide = true;
        const lvl = (g.level || "GREEN").toUpperCase();
        result = {
          riskLevel: lvl,
          score: g.score || 75,
          emotion: g.emotion || "neutral",
          sentiment:
            lvl === "RED"
              ? "needs support"
              : lvl === "ORANGE"
                ? "distressed"
                : g.sentiment || "neutral",
          reasons: (g.reasons || ["general"]).filter((t) => t !== "error"),
          advice: g.advice || getAdvice(t, lvl, "general"),
          source: "gemini-frontend",
          category: "general",
          abuseType: "none",
          abuseSource: "none",
          confidence: 70,
        };
      } catch {
        const f = analyzeRisk(inputText);
        const positiveWords = ["happy", "great", "good", "awesome", "joy", "excited", "love"];
        const hasPositive = positiveWords.some((w) => lower.includes(w));
        const hasNegative = [
          "sad",
          "depressed",
          "anxious",
          "alone",
          "tired",
          "upset",
          "angry",
          "hate",
          "lonely",
        ].some((w) => lower.includes(w));

        // FIX: the two keyword branches below used to ignore `f` entirely,
        // so when the backend was down a message like "I'm so happy I
        // finally decided to end things" hit the positive-keywords branch
        // and came back GREEN even though analyzeRisk() scored it RED.
        // The keyword heuristic may only *lower* risk when the local
        // analyzer also sees nothing - never override a RED/ORANGE it found.
        const localLevel = (f.riskLevel || f.level || "GREEN").toUpperCase();
        const localSaysRisk = localLevel === "RED" || localLevel === "ORANGE";

        if (hasPositive && !hasNegative && !localSaysRisk) {
          result = {
            riskLevel: "GREEN",
            score: 82,
            emotion: "happy",
            sentiment: "positive",
            reasons: ["positive keywords detected"],
            advice: getAdvice(t, "GREEN", "general"),
            source: "fallback-positive",
            category: "general",
            abuseType: "none",
            abuseSource: "none",
            confidence: 65,
          };
        } else if (hasPositive && hasNegative && !localSaysRisk) {
          result = {
            riskLevel: "ORANGE",
            score: 55,
            emotion: "mixed",
            sentiment: "mixed - needs attention",
            reasons: ["mixed emotions detected"],
            advice: getAdvice(t, "ORANGE", "general"),
            source: "fallback-mixed",
            category: "general",
            abuseType: "none",
            abuseSource: "none",
            confidence: 60,
          };
        } else {
          const lvl = (f.riskLevel || f.level || "ORANGE").toUpperCase();
          result = {
            ...f,
            riskLevel: lvl,
            sentiment:
              lvl === "RED" ? "needs support" : lvl === "ORANGE" ? "distressed" : "positive",
            reasons: ["general"],
            advice: getAdvice(t, lvl, "general"),
            source: "fallback",
            category: "general",
            abuseType: "none",
            abuseSource: "none",
            confidence: 50,
          };
        }
      }
    }

    if (!alreadySavedServerSide) {
      if (result.riskLevel === "RED" || result.riskLevel === "ORANGE") {
        saveAlertToAdmin(
          inputText,
          result.score,
          result.riskLevel,
          result.reasons,
          result.category,
          result.abuseType,
          result.abuseSource
        );
      }
    }

    const withTime = {
      ...result,
      counseling: getCounselingAdvice(inputText, result.emotion, result.riskLevel, lang),
      topEmotions: getTopEmotions(inputText),
      voiceTone: voiceData,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      text: inputText,
    };

    setAnalysis(withTime);
    setHistory((h) => {
      const newH = [...h, withTime].slice(-20);
      try {
        localStorage.setItem("emovra_history", JSON.stringify(newH));
      } catch {}
      return newH;
    });
    try {
      saveAnalysis(withTime);
    } catch {}
    if (!alreadySavedServerSide) {
      saveToBackend(withTime);
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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "var(--card-bg, #16161a)",
            borderRadius: 20,
            padding: 32,
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44 }}>📧</div>
          <h2 style={{ color: "var(--text-h)", marginTop: 10 }}>Verify your email</h2>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8, lineHeight: 1.6 }}>
            One last step before you get started - this happens right after signup. We'll send a
            code to <b>{user.email}</b>.
          </p>

          {!verifyOpen ? (
            <button
              onClick={resendVerifyEmail}
              disabled={verifyLoading}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                borderRadius: 999,
                border: "none",
                background: "var(--accent)",
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {verifyLoading ? "Sending..." : "Send verification code"}
            </button>
          ) : (
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--text-h)", marginBottom: 4 }}>
                {verifyMsg}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>
                Don't see it? Check your spam/junk folder too - the code can end up there.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="6-digit code"
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "0.5px solid rgba(212,197,160,0.2)",
                    background: "#0f0f11",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={confirmVerifyEmail}
                  disabled={verifyLoading}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    background: "#22c55e",
                    color: "#000",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Confirm
                </button>
              </div>
              <button
                onClick={resendVerifyEmail}
                disabled={verifyLoading}
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(212,197,160,0.2)",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Resend code
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              marginTop: 20,
              display: "block",
              width: "100%",
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 12,
              textDecoration: "underline",
            }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  const advice = analysis?.advice || getAdvice(t, analysis?.riskLevel, analysis?.category);
  const counselingArray = Array.isArray(analysis?.counseling) ? analysis.counseling : [];
  const isAdmin = user.role === "admin";

  return (
    <>
      <OnboardingWalkthrough />
      <style>{`
        body{background:var(--bg)!important; color:var(--text)!important}
        button[style*="linear-gradient"], button[style*="#8b5cf6"], button[style*="#7c3aed"], button[style*="#a855f7"]{ background:var(--accent)!important; color:#000!important; border:none!important; }
        button{font-family:Inter,sans-serif}
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          backgroundImage: "var(--bg-image, none)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "var(--text)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(10,10,12,1)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              maxWidth: 900,
              margin: "0 auto",
              borderBottom: "0.5px solid rgba(212,197,160,0.15)",
            }}
          >
            <div
              onClick={() => navigate("/")}
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "var(--text-h)",
                letterSpacing: "0.15em",
                cursor: "pointer",
              }}
            >
              EMOVRA
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LanguageToggle style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.4)" }} />
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "0.5px solid rgba(212,197,160,0.3)",
                  background: "transparent",
                  color: "var(--text-h)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                📊 {t("app.dashboardBtn")}
              </button>
              {avatarProfile.avatarType === "custom" && avatarProfile.avatarImage ? (
                <img
                  src={avatarProfile.avatarImage}
                  alt="avatar"
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 20 }}>{avatarProfile.avatar}</span>
              )}
              <span style={{ fontSize: 12, color: "var(--text)", opacity: 0.7 }}>
                {t("app.hiGreeting", { name: user.name })} {isAdmin && "👑"}
              </span>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "0.5px solid rgba(212,197,160,0.3)",
                    background: "rgba(212,197,160,0.12)",
                    color: "var(--text-h)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {t("app.admin")}
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "0.5px solid rgba(212,197,160,0.3)",
                  background: "#141416",
                  color: "var(--text-h)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t("app.logout")}
              </button>
            </div>
          </div>

          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding: "10px 16px 0",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {TABS.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: "pointer",
                  border:
                    tab === tb.id ? "1px solid var(--accent)" : "0.5px solid rgba(212,197,160,0.2)",
                  background: tab === tb.id ? "rgba(212,176,122,0.15)" : "transparent",
                  color: tab === tb.id ? "var(--text-h)" : "rgba(232,220,198,0.6)",
                  fontWeight: tab === tb.id ? 700 : 500,
                }}
              >
                {t(tb.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <main id="main-content" style={{ maxWidth: 720, margin: "18px auto", padding: "0 16px" }}>
          {tab === "checkin" && (
            <>
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: "0.5px solid rgba(212,197,160,0.18)",
                  background: "var(--card-bg)",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>
                  {t("checkin.howAreYouFeeling")}
                </h3>
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  placeholder={t("checkin.placeholder")}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 12,
                    border: "0.5px solid rgba(212,197,160,0.18)",
                    background: "#0f0f11",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 999,
                      border: "none",
                      background: "var(--accent)",
                      color: "#000",
                      fontWeight: 800,
                      cursor: loading ? "default" : "pointer",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {loading && (
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          border: "2px solid rgba(0,0,0,0.25)",
                          borderTopColor: "#000",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "emovra-spin 0.7s linear infinite",
                        }}
                      />
                    )}
                    {loading ? t("checkin.analyzing") : `✨ ${t("checkin.analyze")}`}
                  </button>
                  {loading && (
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{t("checkin.takesTime")}</span>
                  )}
                  <button
                    onClick={() => (listening ? stopListening() : startListening())}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 999,
                      border: "0.5px solid rgba(212,197,160,0.3)",
                      background: "transparent",
                      color: "var(--text-h)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    🎙 {listening ? t("checkin.stop") : t("checkin.speak")}
                  </button>
                  <button
                    onClick={() => {
                      setInputText("");
                      setAnalysis(null);
                    }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 999,
                      border: "0.5px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "rgba(232,220,198,0.6)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {t("checkin.clear")}
                  </button>
                </div>
                {micError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12,
                      marginTop: 10,
                    }}
                  >
                    {micError}
                  </div>
                )}
              </div>

              {analysis && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      background: "rgba(18,18,20,0.9)",
                      border: "0.5px solid rgba(212,197,160,0.15)",
                      borderRadius: 12,
                      padding: 8,
                    }}
                  >
                    <RiskCard
                      analysis={analysis}
                      text={analysis.text}
                      userName={user.name}
                      emergencyPhone={user.emergencyPhone}
                      emergencyCountryCode={user.countryCode}
                      safetyPlan={safetyPlan}
                    />
                    <Suspense fallback={<Loader />}>
                      <MoodChart history={history.length ? history : [analysis]} />
                    </Suspense>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      border: "0.5px solid rgba(212,197,160,0.18)",
                      borderRadius: 12,
                      background: "rgba(18,18,20,0.9)",
                      color: "var(--text)",
                      fontSize: 13,
                    }}
                  >
                    <b style={{ color: "var(--text-h)" }}>{t("checkin.adviceLabel")}</b> {advice}
                  </div>
                  {counselingArray.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <h4 style={{ color: "var(--text-h)" }}>{t("checkin.solutions")}</h4>
                      {counselingArray.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 12,
                            border: "0.5px solid rgba(212,197,160,0.15)",
                            background: "rgba(18,18,20,0.9)",
                            borderRadius: 10,
                            marginTop: 8,
                            fontSize: 13,
                          }}
                        >
                          <b style={{ color: "var(--text-h)" }}>{c.technique}</b>
                          <p style={{ margin: "6px 0 0 0", color: "rgba(232,220,198,0.7)" }}>
                            {c.advice}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "voice-mood" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Suspense fallback={<Loader />}>
                <VoiceToneAnalyzer token={token} onResult={setVoiceData} />
                <MoodTracker />
              </Suspense>
            </div>
          )}

          {tab === "journal" && (
            <Suspense fallback={<Loader />}>
              <Journal />
            </Suspense>
          )}

          {tab === "wellness" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Suspense fallback={<Loader />}>
                <GroundingExercises />
                <TeleManas />
              </Suspense>
            </div>
          )}

          {tab === "chat" && (
            <Suspense fallback={<Loader />}>
              <Chatbot />
            </Suspense>
          )}

          <div
            style={{
              marginTop: 20,
              padding: "16px",
              textAlign: "center",
              fontSize: "11px",
              color: "rgba(232,220,198,0.4)",
              borderTop: "0.5px solid rgba(212,197,160,0.12)",
            }}
          >
            <span style={{ color: "var(--text-h)", letterSpacing: "0.15em", fontWeight: 700 }}>
              EMOVRA
            </span>{" "}
            - {t("checkin.footerDisclaimer")}
          </div>
        </main>
        <LegalCookieBanner />
      </div>
    </>
  );
}
