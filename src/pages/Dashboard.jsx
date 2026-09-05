import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import {
  Home, Smile, BookOpen, Palette, MessageCircle, Droplets, Trees,
  Shield, Settings as SettingsIcon, Bell, Moon, Sparkles, HelpCircle, X,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import Footer from "../components/Footer.jsx";
import VirtualPet from "../components/VirtualPet.jsx";
import GoalReminders from "../components/GoalReminders.jsx";
import { loadMoodHistory } from "../utils/storage.js";

const HabitTracker = lazy(() => import("../components/HabitTracker"));
const GoalPlanner = lazy(() => import("../components/GoalPlanner"));
const MentalHealthInsights = lazy(() => import("../components/MentalHealthInsights"));
const WellnessCalendar = lazy(() => import("../components/WellnessCalendar"));
const SleepAssistant = lazy(() => import("../components/SleepAssistant"));
const CreativeCorner = lazy(() => import("../components/CreativeCorner"));
const MusicTherapy = lazy(() => import("../components/MusicTherapy"));
const PersonalityQuiz = lazy(() => import("../components/PersonalityQuiz"));
const ThemeAvatarSettings = lazy(() => import("../components/ThemeAvatarSettings"));
const RelaxationGames = lazy(() => import("../components/RelaxationGames"));
const SocialSkills = lazy(() => import("../components/SocialSkills"));
const FortuneCookie = lazy(() => import("../components/FortuneCookie"));
const CBTTools = lazy(() => import("../components/CBTTools"));
const CreativeExpression = lazy(() => import("../components/CreativeExpression"));
const MindGames = lazy(() => import("../components/MindGames"));
const ZenGarden = lazy(() => import("../components/ZenGarden"));
const SelfCareTools = lazy(() => import("../components/SelfCareTools"));
const CloudPrompts = lazy(() => import("../components/CloudPrompts"));
const CalmGarden = lazy(() => import("../components/CalmGarden"));
const ScheduledLetters = lazy(() => import("../components/ScheduledLetters"));
const LifeTimeline = lazy(() => import("../components/LifeTimeline"));
const DigitalTimeMachine = lazy(() => import("../components/DigitalTimeMachine"));
const DailyAffirmation = lazy(() => import("../components/DailyAffirmation"));
const SafetyPlan = lazy(() => import("../components/SafetyPlan"));
const ComplimentGenerator = lazy(() => import("../components/ComplimentGenerator"));
const Chatbot = lazy(() => import("../components/Chatbot"));

const Journal = lazy(() => import("../components/Journal"));

import { API_BASE as API } from "../config/api.js";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const Loader = () => {
  const { t } = useLanguage();
  return <div style={{ padding: 12, textAlign: "center", color: "var(--text-h)", fontSize: 11 }}>{t("dashboard.loading")}</div>;
};

const NAV_ITEMS = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: Home },
  { id: "mood", labelKey: "nav.mood", icon: Smile },
  { id: "journal", labelKey: "nav.journal", icon: BookOpen },
  { id: "creative", labelKey: "nav.creative", icon: Palette },
  { id: "companion", labelKey: "nav.companion", icon: MessageCircle },
  { id: "rituals", labelKey: "nav.rituals", icon: Droplets },
  { id: "sanctuary", labelKey: "nav.sanctuary", icon: Trees },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [toast, setToast] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [pendingChallengesScroll, setPendingChallengesScroll] = useState(false);
  const location = useLocation();

  const activeId = location.pathname === "/dashboard" ? "dashboard" : (location.pathname.split("/")[2] || "dashboard");
  const goTo = (id) => navigate(id === "dashboard" ? "/dashboard" : `/dashboard/${id}`);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // The bell needs to be visible from every dashboard sub-page, but the
  // #ev-challenges card only exists on the index route. If we're not
  // already there, navigate home first and scroll once that card mounts.
  function goToChallenges() {
    if (activeId !== "dashboard") {
      setPendingChallengesScroll(true);
      goTo("dashboard");
    } else {
      document.getElementById("ev-challenges")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => {
    if (pendingChallengesScroll && activeId === "dashboard") {
      const el = document.getElementById("ev-challenges");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setPendingChallengesScroll(false);
      }
    }
  }, [pendingChallengesScroll, activeId, data]);

  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null")?.role === "admin"; }
    catch { return false; }
  })();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    load();
  }, []);

  async function claim(id) {
    setClaiming(id);
    try {
      const res = await fetch(`${API}/challenges/${id}/claim`, { method: "POST", headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setData((d) => d ? { ...d, challenges: d.challenges.map((c) => c.id === id ? { ...c, claimed: true } : c) } : d);
        if (json.newBadges?.length) {
          setToast(`🎉 New badge: ${json.newBadges.map((b) => b.name).join(", ")}!`);
          setTimeout(() => setToast(null), 4000);
        } else if (json.leveledUp) {
          setToast(`🎉 Level up! You're now level ${json.level}`);
          setTimeout(() => setToast(null), 4000);
        }
        await loadQuiet();
      } else {
        alert(json.message || t("dashboard.couldNotClaim"));
      }
    } catch {}
    setClaiming(null);
  }

  async function loadQuiet() {
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        {t("dashboard.loadingDashboard")}
      </div>
    );
  }

  const g = data?.gamification;
  const progressPct = g ? Math.round((g.progress || 0) * 100) : 0;
  const firstName = data?.name ? data.name.split(" ")[0] : "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dashboard.greetingMorning") : hour < 18 ? t("dashboard.greetingAfternoon") : t("dashboard.greetingEvening");
  const unclaimedCount = (data?.challenges || []).filter((c) => !c.claimed).length;
  const hasAlert = !!data?.earlyWarning?.triggered;

  const MOOD_SCALE = { "Happy": 5, "Calm": 4, "Neutral": 3, "Sad": 2, "Anxious": 2, "Angry": 1, "Lonely": 1, "Overwhelmed": 1, "Don't Know What To Do": 2, "Everything Fell On You At Once": 1 };
  const moodHistory = loadMoodHistory();
  const moodChartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayEntries = moodHistory.filter((e) => new Date(e.timestamp).toISOString().slice(0, 10) === key);
      const scores = dayEntries.map((e) => MOOD_SCALE[e.mood]).filter((s) => s !== undefined);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), value: avg });
    }
    return days;
  })();

  const allChallengesDone = (data?.challenges?.length || 0) > 0 && unclaimedCount === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", backgroundImage: "var(--bg-image, none)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", color: "var(--text)", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        .ev-shell { display: flex; min-height: 100vh; }
        .ev-sidebar {
          width: 230px; flex-shrink: 0; padding: 22px 16px;
          border-right: 0.5px solid rgba(212,197,160,0.15);
          display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh;
        }
        .ev-logo { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; letter-spacing: 0.08em; color: var(--text-h); padding: 4px 8px 22px; }
        .ev-nav-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px;
          color: rgba(232,220,198,0.65); font-size: 13.5px; cursor: pointer; margin-bottom: 4px;
          border: 1px solid transparent; background: transparent; transition: 0.15s;
        }
        .ev-nav-item:hover { background: rgba(212,197,160,0.06); }
        .ev-nav-item.active { background: rgba(212,176,122,0.12); color: var(--text-h); border-color: rgba(212,176,122,0.3); font-weight: 600; }
        .ev-sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 4px; padding-top: 12px; border-top: 0.5px solid rgba(212,197,160,0.12); }
        .ev-main { flex: 1; min-width: 0; padding: 28px 28px 60px; }
        .ev-topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
        .ev-streak-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(212,176,122,0.12); border: 1px solid rgba(212,176,122,0.3); padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-left: 12px; }
        .ev-bell { position: relative; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border); background: var(--card-bg); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ev-dot { position: absolute; top: 7px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #f87171; border: 1.5px solid var(--bg); }
        .ev-status-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--bg); box-shadow: 0 0 0 1px rgba(212,197,160,0.2); }
        .ev-card { background: var(--card-bg); border: 0.5px solid rgba(212,197,160,0.18); border-radius: 22px; padding: 20px; }
        .ev-card-title { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; color: var(--text-h); }
        .ev-bento-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 14px; }
        .ev-mini-card { cursor: pointer; transition: transform 0.15s, border-color 0.15s; }
        .ev-mini-card:hover { transform: translateY(-2px); border-color: rgba(212,176,122,0.4); }
        @media (max-width: 980px) { .ev-bento-row { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .ev-sidebar { display: none; }
          .ev-main { padding: 18px 14px 120px; }
          .ev-bento-row { grid-template-columns: 1fr; }
          .ev-mobile-nav { display: flex !important; }
        }
        .ev-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--card-bg); border-top: 0.5px solid rgba(212,197,160,0.18); padding: 8px 6px calc(8px + env(safe-area-inset-bottom)); justify-content: space-between; z-index: 50; overflow-x: auto; }
      `}</style>

      <div className="ev-shell">
        <aside className="ev-sidebar">
          <div className="ev-logo"><Moon size={16} /> EMOVRA</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className={`ev-nav-item${activeId === item.id ? " active" : ""}`} onClick={() => goTo(item.id)}>
                <Icon size={17} /> {t(item.labelKey)}
              </div>
            );
          })}
          <div className="ev-sidebar-bottom">
            {isAdmin && (
              <div className="ev-nav-item" onClick={() => navigate("/admin")}>
                <Shield size={17} /> {t("nav.admin")}
              </div>
            )}
            <div className={`ev-nav-item${activeId === "settings" ? " active" : ""}`} onClick={() => goTo("settings")}>
              <SettingsIcon size={17} /> {t("nav.settings")}
            </div>
          </div>
        </aside>

        <div className="ev-main">
          {toast && (
            <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#000", padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
              {toast}
            </div>
          )}

          {showGuide && (
            <div
              onClick={() => setShowGuide(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.25)", borderRadius: 22, padding: 26, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-h)" }}>{t("dashboard.quickGuideTitle")}</h2>
                    <p style={{ fontSize: 12.5, color: "rgba(232,220,198,0.6)", margin: "6px 0 0" }}>{t("dashboard.quickGuideIntro")}</p>
                  </div>
                  <button onClick={() => setShowGuide(false)} aria-label={t("dashboard.quickGuideClose")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(232,220,198,0.6)", padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", marginTop: 20, marginBottom: 10 }}>{t("guide.nav.title")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: Home, text: t("guide.nav.dashboard") },
                    { icon: Smile, text: t("guide.nav.mood") },
                    { icon: BookOpen, text: t("guide.nav.journal") },
                    { icon: Palette, text: t("guide.nav.creative") },
                    { icon: MessageCircle, text: t("guide.nav.companion") },
                    { icon: Droplets, text: t("guide.nav.rituals") },
                    { icon: Trees, text: t("guide.nav.sanctuary") },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Icon size={15} style={{ marginTop: 2, flexShrink: 0, color: "var(--accent)" }} />
                      <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{text}</span>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", marginTop: 22, marginBottom: 10 }}>{t("guide.widgets.title")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    t("guide.widget.levelXp"),
                    t("guide.widget.moodChart"),
                    t("guide.widget.sleep"),
                    t("guide.widget.habitTracker"),
                    t("guide.widget.virtualPet"),
                    t("guide.widget.zenGarden"),
                    t("guide.widget.aiCompanion"),
                    t("guide.widget.supportCard"),
                    t("guide.widget.challenges"),
                    t("guide.widget.bell"),
                    t("guide.widget.statusDots"),
                    t("guide.widget.languageToggle"),
                    t("guide.widget.settings"),
                  ].map((text, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", marginTop: 7, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowGuide(false)}
                  style={{ marginTop: 22, width: "100%", background: "var(--accent)", color: "#000", border: "none", padding: "12px 20px", borderRadius: 999, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
                >
                  {t("dashboard.quickGuideClose")}
                </button>
              </div>
            </div>
          )}

                    <div className="ev-topbar">
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
                {greeting}{firstName ? `, ${firstName}` : ""}
              </h1>
              {(g?.streakDays || 0) > 0 && (
                <span className="ev-streak-pill">🔥 {t("dashboard.dayStreak", { n: g.streakDays })}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <LanguageToggle />
            <div className="ev-bell" onClick={() => setShowGuide(true)} title={t("dashboard.quickGuide")}>
              <HelpCircle size={16} />
            </div>
            <div className="ev-bell" onClick={() => goTo("settings")} title={t("nav.settings")}>
              <SettingsIcon size={16} />
            </div>
              <div className="ev-bell" onClick={goToChallenges} title={unclaimedCount > 0 ? t("dashboard.challengesWaiting", { n: unclaimedCount }) : t("dashboard.noNewNotifications")}>
                <Bell size={16} />
                {(unclaimedCount > 0 || hasAlert) && <span className="ev-dot" />}
              </div>
              <div style={{ display: "flex", gap: -4 }}>
                <div className="ev-status-dot" style={{ background: "var(--accent)", marginLeft: 0 }} title="Emovra" />
                <div className="ev-status-dot" style={{ background: allChallengesDone ? "#4ade80" : "rgba(74,222,128,0.25)", marginLeft: -8 }} title={allChallengesDone ? t("dashboard.todayCheckedOff") : t("dashboard.challengesStillOpen")} />
                <div className="ev-status-dot" style={{ background: hasAlert ? "#fb923c" : "rgba(251,146,60,0.2)", marginLeft: -8 }} title={hasAlert ? t("dashboard.nudgeActive") : t("dashboard.noActiveNudges")} />
              </div>
            </div>
          </div>

          <Routes>
            <Route index element={(
            <>
                            <div className="ev-card" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-h)" }}>{t("dash.level", { n: g?.level || 1 })}</div>
                    <div style={{ fontSize: 12, color: "rgba(232,220,198,0.5)" }}>{g?.xp || 0} XP</div>
                  </div>
                  <button onClick={() => navigate("/app")} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {t("dash.continueToEmovra")}
                  </button>
                </div>
                <div style={{ marginTop: 14, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--text))", transition: "width 0.4s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "rgba(232,220,198,0.4)", marginTop: 6 }}>{t("dash.progressToLevel", { pct: progressPct, n: (g?.level || 1) + 1 })}</div>
              </div>

                            <div className="ev-card">
                <h3 className="ev-card-title">{t("dashboard.moodThisWeek")}</h3>
                <svg viewBox="0 0 620 150" style={{ width: "100%", height: 150, marginTop: 10, overflow: "visible" }}>
                  <defs>
                    <linearGradient id="evMoodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const points = moodChartData.map((d, i) => ({
                      x: 20 + i * (580 / 6),
                      y: d.value != null ? 118 - ((d.value - 1) / 4) * 92 : null,
                      label: d.label,
                    }));
                    const valid = points.filter((p) => p.y != null);
                    if (valid.length === 0) {
                      return <text x="310" y="70" textAnchor="middle" fontSize="12" fill="rgba(232,220,198,0.4)">{t("dashboard.logMoodPrompt")}</text>;
                    }
                    let linePath = "", areaPath = "", drawing = false, first = null, last = null;
                    points.forEach((p) => {
                      if (p.y == null) { drawing = false; return; }
                      if (!drawing) { linePath += `M${p.x},${p.y} `; areaPath += `M${p.x},130 L${p.x},${p.y} `; drawing = true; first = first ?? p; }
                      else { linePath += `L${p.x},${p.y} `; areaPath += `L${p.x},${p.y} `; }
                      last = p;
                    });
                    return (
                      <>
                        <line x1="20" y1="130" x2="600" y2="130" stroke="rgba(212,197,160,0.15)" strokeWidth="1" />
                        <path d={`${areaPath}L${last.x},130 Z`} fill="url(#evMoodFill)" stroke="none" />
                        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p, i) => p.y != null && <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />)}
                        {points.map((p, i) => <text key={i} x={p.x} y="144" textAnchor="middle" fontSize="10.5" fill="rgba(232,220,198,0.5)">{p.label}</text>)}
                      </>
                    );
                  })()}
                </svg>
              </div>

                            <div className="ev-bento-row">
                <div className="ev-card ev-mini-card" onClick={() => goTo("journal")}>
                  <h3 className="ev-card-title"><Moon size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{t("dashboard.sleep")}</h3>
                  <div style={{ marginTop: 8, height: 74, borderRadius: 14, background: "linear-gradient(160deg,#1a1a3a,#2b2350)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={26} color="rgba(212,197,160,0.7)" />
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(232,220,198,0.6)", marginTop: 10 }}>{t("dashboard.windDownLink")}</div>
                </div>

                <div className="ev-card ev-mini-card" onClick={() => goTo("rituals")}>
                  <h3 className="ev-card-title">{t("dashboard.habitTracker")}</h3>
                  {data?.habits?.count > 0 ? (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text)" }}>
                      🌱 {t("dashboard.dueToday", { due: data.habits.dueToday, count: data.habits.count })}
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(232,220,198,0.5)" }}>{t("dashboard.noHabitsYet")}</div>
                  )}
                  <div style={{ fontSize: 11, color: "rgba(232,220,198,0.4)", marginTop: 10 }}>{t("dashboard.openRituals")}</div>
                </div>

                <div className="ev-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <h3 className="ev-card-title" style={{ alignSelf: "flex-start" }}>{t("dashboard.virtualCompanionPet")}</h3>
                  <VirtualPet level={g?.level || 1} xp={g?.xp || 0} />
                </div>
              </div>

                            <div className="ev-bento-row">
                <div className="ev-card ev-mini-card" onClick={() => goTo("sanctuary")}>
                  <h3 className="ev-card-title">🪨 {t("dashboard.zenGarden")}</h3>
                  <div style={{ marginTop: 8, height: 74, borderRadius: 14, background: "linear-gradient(160deg,#e8dcc0,#d8c8a0)" }} />
                  <div style={{ fontSize: 11, color: "rgba(232,220,198,0.4)", marginTop: 10 }}>{t("dashboard.openSanctuary")}</div>
                </div>

                <div className="ev-card" style={{ gridColumn: "span 1", cursor: "pointer" }} onClick={() => goTo("companion")}>
                  <h3 className="ev-card-title">💬 {t("dashboard.aiCompanionChat")}</h3>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ alignSelf: "flex-start", background: "rgba(212,197,160,0.1)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", fontSize: 11.5, maxWidth: "85%" }}>
                      {t("dashboard.companionGreeting")}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,220,198,0.4)", marginTop: 10 }}>{t("dashboard.openCompanion")}</div>
                </div>

                <div className="ev-card" style={{
                  background: hasAlert ? "linear-gradient(135deg,#7c2d12,#c2410c)" : "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.05))",
                  border: hasAlert ? "1px solid rgba(251,146,60,0.5)" : "1px solid rgba(74,222,128,0.25)",
                }}>
                  <h3 className="ev-card-title" style={{ color: hasAlert ? "#fff" : "var(--text-h)" }}>
                    {hasAlert ? `💛 ${t("dashboard.supportNotified")}` : `✅ ${t("dashboard.allClear")}`}
                  </h3>
                  <p style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5, color: hasAlert ? "rgba(255,255,255,0.9)" : "rgba(232,220,198,0.6)" }}>
                    {hasAlert ? data.earlyWarning.message : t("dashboard.noActiveNudgesBody")}
                  </p>
                  {hasAlert && (
                    <a href="tel:14416" style={{ display: "inline-block", marginTop: 8, background: "#fff", color: "#7c2d12", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 11, textDecoration: "none" }}>
                      📞 Tele-MANAS: 14416
                    </a>
                  )}
                </div>
              </div>

              {data?.isBirthdayToday && (
                <div style={{ background: "linear-gradient(135deg, rgba(212,176,122,0.2), rgba(168,85,247,0.12))", border: "1px solid var(--accent)", borderRadius: 16, padding: 20, marginTop: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>🎂🎉</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6, color: "var(--text-h)" }}>{t("dash.happyBirthday")}{firstName ? `, ${firstName}` : ""}!</div>
                  <p style={{ fontSize: 12, marginTop: 4, color: "rgba(232,220,198,0.7)" }}>{t("dash.birthdayMsg")}</p>
                </div>
              )}

              {data?.friendEntryPreview && (
                <div className="ev-card" style={{ marginTop: 14, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>👯 {t("dash.wroteIn", { author: data.friendEntryPreview.authorName })} "{data.friendEntryPreview.journalTitle}"</div>
                  <p style={{ fontSize: 13, marginTop: 8, color: "var(--text)", opacity: 0.85, fontStyle: "italic" }}>
                    "{data.friendEntryPreview.text.slice(0, 140)}{data.friendEntryPreview.text.length > 140 ? "..." : ""}"
                  </p>
                </div>
              )}

                            <div id="ev-challenges" className="ev-card" style={{ marginTop: 14 }}>
                <h3 className="ev-card-title" style={{ marginBottom: 10 }}>🎯 {t("dash.todaysChallenges")}</h3>
                {data?.challenges?.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 16, padding: "12px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t(`challenge.${c.id}`)}</div>
                        <div style={{ fontSize: 11, color: "rgba(232,220,198,0.5)" }}>+{c.xp} XP</div>
                      </div>
                    </div>
                    {c.claimed ? (
                      <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>✓ {t("dash.done")}</span>
                    ) : (
                      <button onClick={() => claim(c.id)} disabled={claiming === c.id} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: claiming === c.id ? "default" : "pointer", opacity: claiming === c.id ? 0.7 : 1 }}>
                        {claiming === c.id ? t("dashboard.claiming") : t("dash.claim")}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {g?.badges?.length > 0 && (
                <div className="ev-card" style={{ marginTop: 14 }}>
                  <h3 className="ev-card-title" style={{ marginBottom: 10 }}>🏅 {t("dash.yourBadges")}</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {g.badges.map((b) => (
                      <div key={b.id} title={b.description} style={{ background: "rgba(212,197,160,0.1)", border: "1px solid rgba(212,197,160,0.25)", borderRadius: 16, padding: "10px 14px", textAlign: "center", minWidth: 90 }}>
                        <div style={{ fontSize: 22 }}>{b.emoji}</div>
                        <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{b.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
            )} />

            <Route path="mood" element={(
              <Suspense fallback={<Loader />}>
                <MentalHealthInsights />
                <WellnessCalendar />
                <PersonalityQuiz />
              </Suspense>
            )} />

            <Route path="journal" element={(
              <Suspense fallback={<Loader />}>
                <Journal />
                <SleepAssistant />
                <SocialSkills />
                <LifeTimeline />
                <ScheduledLetters />
                <DailyAffirmation />
                <SafetyPlan />
              </Suspense>
            )} />

            <Route path="creative" element={(
              <Suspense fallback={<Loader />}>
                <CreativeCorner />
                <CreativeExpression />
                <FortuneCookie />
                <ComplimentGenerator />
              </Suspense>
            )} />

            <Route path="companion" element={(
              <Suspense fallback={<Loader />}>
                <Chatbot />
                <CBTTools />
                <MindGames />
                <DigitalTimeMachine />
              </Suspense>
            )} />

            <Route path="rituals" element={(
              <Suspense fallback={<Loader />}>
                <HabitTracker />
                <GoalPlanner />
                <GoalReminders />
              </Suspense>
            )} />

            <Route path="sanctuary" element={(
              <Suspense fallback={<Loader />}>
                <CloudPrompts />
                <RelaxationGames />
                <ZenGarden />
                <MusicTherapy />
                <SelfCareTools />
                <CalmGarden />
              </Suspense>
            )} />

            <Route path="settings" element={(
              <Suspense fallback={<Loader />}>
                <ThemeAvatarSettings onProfileUpdate={loadQuiet} />
              </Suspense>
            )} />

                        <Route path="*" element={<div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>{t("dashboard.pageNotFound")}</div>} />
          </Routes>

          <Footer />
        </div>
      </div>

            <div className="ev-mobile-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => goTo(item.id)} style={{
              background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "6px 10px", color: activeId === item.id ? "var(--text-h)" : "rgba(232,220,198,0.5)",
              fontSize: 9, cursor: "pointer", flexShrink: 0,
            }}>
              <Icon size={16} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
