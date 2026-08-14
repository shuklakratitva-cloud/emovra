import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx"; // NEW
import LanguageToggle from "../components/LanguageToggle.jsx"; // NEW
import Footer from "../components/Footer.jsx"; // NEW: was never rendered anywhere - added here so the Dashboard also has the crisis-resource disclaimer

// NEW: everything that used to be extra tabs in MindGuardApp.jsx now lives
// here instead, per your request - the main app keeps only the original
// features + the AI chatbot.
const HabitTracker = lazy(() => import("../components/HabitTracker"));
const GoalPlanner = lazy(() => import("../components/GoalPlanner"));
const MentalHealthInsights = lazy(() => import("../components/MentalHealthInsights"));
const WellnessCalendar = lazy(() => import("../components/WellnessCalendar"));
const SleepAssistant = lazy(() => import("../components/SleepAssistant"));
const CreativeCorner = lazy(() => import("../components/CreativeCorner"));
const MusicTherapy = lazy(() => import("../components/MusicTherapy"));
const PersonalityQuiz = lazy(() => import("../components/PersonalityQuiz"));
const ThemeAvatarSettings = lazy(() => import("../components/ThemeAvatarSettings"));
const RelaxationGames = lazy(() => import("../components/RelaxationGames")); // NEW
const SocialSkills = lazy(() => import("../components/SocialSkills")); // NEW
const FortuneCookie = lazy(() => import("../components/FortuneCookie")); // NEW
const CBTTools = lazy(() => import("../components/CBTTools")); // NEW
const CreativeExpression = lazy(() => import("../components/CreativeExpression")); // NEW
const MindGames = lazy(() => import("../components/MindGames")); // NEW
const ZenGarden = lazy(() => import("../components/ZenGarden")); // NEW
const SelfCareTools = lazy(() => import("../components/SelfCareTools")); // NEW
const ScheduledLetters = lazy(() => import("../components/ScheduledLetters")); // NEW
const LifeTimeline = lazy(() => import("../components/LifeTimeline")); // NEW
const DigitalTimeMachine = lazy(() => import("../components/DigitalTimeMachine")); // NEW
const DailyAffirmation = lazy(() => import("../components/DailyAffirmation")); // NEW
const SafetyPlan = lazy(() => import("../components/SafetyPlan")); // NEW
const ComplimentGenerator = lazy(() => import("../components/ComplimentGenerator")); // NEW
import VirtualPet from "../components/VirtualPet.jsx"; // NEW: tiny, no need to lazy-load
import GoalReminders from "../components/GoalReminders.jsx"; // NEW: tiny, no need to lazy-load
import { loadMoodHistory } from "../utils/storage.js"; // NEW: for the mood chart

const API = "https://emovra.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const Loader = () => <div style={{ padding: 12, textAlign: "center", color: "var(--text-h)", fontSize: 11 }}>Loading...</div>;

const SUB_TABS = [
  { id: "overview", labelKey: "tab.overview" },
  { id: "habits-goals", labelKey: "tab.habitsGoals" },
  { id: "insights", labelKey: "tab.insights" },
  { id: "relax", labelKey: "tab.relax" },
  { id: "mind", labelKey: "tab.mindGames" },
  { id: "creative", labelKey: "tab.creative" },
  { id: "reflect", labelKey: "tab.reflect" },
  { id: "settings", labelKey: "tab.settings" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage(); // NEW
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [toast, setToast] = useState(null);
  const [subTab, setSubTab] = useState("overview"); // NEW

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
        // NEW: show "claimed" immediately instead of waiting on a full
        // reload - the reload below still happens right after (to sync
        // XP/level/badges for real), but the person doesn't have to wait
        // for it just to see their claim register.
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
        alert(json.message || "Could not claim");
      }
    } catch {}
    setClaiming(null);
  }

  // Same as load(), minus the loading-spinner flash - used after a claim,
  // where the person is already looking at the page and shouldn't see it
  // blank out just to sync XP/level in the background.
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
        Loading your dashboard...
      </div>
    );
  }

  const g = data?.gamification;
  const progressPct = g ? Math.round((g.progress || 0) * 100) : 0;

  // NEW: mood chart data - aggregates the last 7 days from the same
  // local mood history the Voice & Mood tab already writes to, no new
  // data source or backend change needed. Mood labels are mapped to a
  // rough 1-5 wellbeing scale purely for charting, not a clinical score.
  const MOOD_SCALE = { "Happy": 5, "Calm": 4, "Neutral": 3, "Sad": 2, "Anxious": 2, "Angry": 1, "Lonely": 1, "Overwhelmed": 1, "Don't Know What To Do": 2, "Everything Fell On You At Once": 1 };
  const moodChartData = (() => {
    const history = loadMoodHistory();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayEntries = history.filter((e) => new Date(e.timestamp).toISOString().slice(0, 10) === key);
      const scores = dayEntries.map((e) => MOOD_SCALE[e.mood]).filter((s) => s !== undefined);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), value: avg });
    }
    return days;
  })();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* NEW: soft background auras for visual depth, inspired by a dashboard
          mockup - purely decorative, absolutely positioned so layout/clicks
          are never affected. */}
      <div style={{ position: "absolute", left: -160, top: -40, width: 320, height: 320, borderRadius: "50%", background: "var(--accent)", opacity: 0.12, filter: "blur(90px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -100, top: 300, width: 280, height: 280, borderRadius: "50%", background: "var(--accent)", opacity: 0.07, filter: "blur(90px)", pointerEvents: "none" }} />

      {/* NEW: sidebar (desktop only, via CSS) + main content shell. The
          existing pill tab bar further down stays in the DOM as the mobile
          fallback - CSS toggles which one is visible, no JS screen-width
          detection needed. */}
      <div className="emovra-app-shell" style={{ position: "relative" }}>
        <aside className="emovra-sidebar">
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-h)", letterSpacing: "0.1em", marginBottom: 20, paddingLeft: 4 }}>EMOVRA</div>
          {SUB_TABS.map((tab) => (
            <div key={tab.id} onClick={() => setSubTab(tab.id)} className={`emovra-sidebar-nav-item${subTab === tab.id ? " active" : ""}`}>
              {t(tab.labelKey)}
            </div>
          ))}
        </aside>
        <div style={{ flex: 1, padding: "32px 20px", minWidth: 0 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>

        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#000", padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            {toast}
          </div>
        )}

        <div className="emovra-card-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 40, width: 56, height: 56, borderRadius: "50%", background: "rgba(212,197,160,0.1)", border: "1px solid rgba(212,197,160,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {data?.avatarType === "custom" && data?.avatarImage
                ? <img src={data.avatarImage} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : (data?.avatar || "🦋")}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 34, margin: 0 }}>
                {t("dash.welcomeBack")}{data?.name ? `, ${data.name.split(" ")[0]}` : ""} 👋
              </h1>
              <p style={{ color: "rgba(232,220,198,0.6)", fontSize: 13, marginTop: 6 }}>
                {t("dash.whereYouAt")}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LanguageToggle />
            <button
            onClick={() => navigate("/app")}
            style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {t("dash.continueToEmovra")}
          </button>
          </div>
        </div>

        {/* Level / XP / Streak - always visible, this is the core of the dashboard */}
        <div className="emovra-card-rise" style={{ animationDelay: "0.05s", background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.18)", borderRadius: 24, padding: 24, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-h)" }}>{t("dash.level", { n: g?.level || 1 })}</div>
              <div style={{ fontSize: 12, color: "rgba(232,220,198,0.5)" }}>{g?.xp || 0} XP</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", padding: "8px 16px", borderRadius: 999 }}>
              <span className="emovra-breathing" style={{ fontSize: 16, display: "inline-block" }}>🔥</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{g?.streakDays || 0}</span>
              <span style={{ fontSize: 11, color: "rgba(232,220,198,0.6)" }}>{t("dash.dayStreak")}</span>
            </div>
          </div>
          <div style={{ marginTop: 14, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--text))", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(232,220,198,0.4)", marginTop: 6 }}>{t("dash.progressToLevel", { pct: progressPct, n: (g?.level || 1) + 1 })}</div>
        </div>

        {/* NEW: mood chart - 7-day trend from local mood history, hand-rolled
            SVG (no recharts dependency added, avoiding new-dependency
            deployment risk). Gaps are left for days with no logged mood
            rather than plotting them as zero. */}
        <div className="emovra-card-rise" style={{ animationDelay: "0.08s", background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 24, padding: "20px 20px 12px", marginTop: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{t("dash.moodChartTitle")}</h3>
          <svg viewBox="0 0 320 110" style={{ width: "100%", height: 110, marginTop: 10, overflow: "visible" }}>
            <defs>
              <linearGradient id="emovraMoodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const points = moodChartData.map((d, i) => ({
                x: 10 + i * (300 / 6),
                y: d.value != null ? 90 - ((d.value - 1) / 4) * 70 : null,
                label: d.label,
              }));
              const valid = points.filter((p) => p.y != null);
              if (valid.length === 0) {
                return <text x="160" y="55" textAnchor="middle" fontSize="11" fill="rgba(232,220,198,0.4)">{t("dash.moodChartEmpty")}</text>;
              }
              let linePath = "";
              let areaPath = "";
              let drawing = false;
              points.forEach((p) => {
                if (p.y == null) { drawing = false; return; }
                if (!drawing) {
                  linePath += `M${p.x},${p.y} `;
                  areaPath += `M${p.x},90 L${p.x},${p.y} `;
                  drawing = true;
                } else {
                  linePath += `L${p.x},${p.y} `;
                  areaPath += `L${p.x},${p.y} `;
                }
              });
              return (
                <>
                  <line x1="10" y1="90" x2="310" y2="90" stroke="rgba(212,197,160,0.15)" strokeWidth="1" />
                  <path d={`${areaPath}L${valid[valid.length - 1].x},90 Z`} fill="url(#emovraMoodFill)" stroke="none" />
                  <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((p, i) => p.y != null && <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" />)}
                  {points.map((p, i) => <text key={i} x={p.x} y="104" textAnchor="middle" fontSize="9" fill="rgba(232,220,198,0.5)">{p.label}</text>)}
                </>
              );
            })()}
          </svg>
        </div>

        {/* NEW: Pet + Badges grouped into a compact widget grid - both are
            naturally card-shaped content, unlike Today's Challenges below
            (a list, which stays full-width rather than being cramped into
            a narrow grid column). */}
        <div className="emovra-widget-grid" style={{ marginTop: 12 }}>
          <VirtualPet level={g?.level || 1} xp={g?.xp || 0} />
          {g?.badges?.length > 0 && (
            <div className="emovra-card-rise" style={{ animationDelay: "0.15s", background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 24, padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>🏅 {t("dash.yourBadges")}</h3>
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
        </div>

        {data?.isBirthdayToday && (
          <div style={{ background: "linear-gradient(135deg, rgba(212,176,122,0.2), rgba(168,85,247,0.12))", border: "1px solid var(--accent)", borderRadius: 16, padding: 20, marginTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>🎂🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6, color: "var(--text-h)" }}>{t("dash.happyBirthday")}{data?.name ? `, ${data.name.split(" ")[0]}` : ""}!</div>
            <p style={{ fontSize: 12, marginTop: 4, color: "rgba(232,220,198,0.7)" }}>{t("dash.birthdayMsg")}</p>
          </div>
        )}

        {data?.earlyWarning?.triggered && (
          <div style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.35)", borderRadius: 16, padding: 18, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fb923c" }}>💛 {t("dash.gentleCheckIn")}</div>
            <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{data.earlyWarning.message}</p>
            <a href="tel:14416" style={{ display: "inline-block", marginTop: 10, background: "var(--accent)", color: "#000", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
              📞 Tele-MANAS: 14416
            </a>
          </div>
        )}

        {data?.friendEntryPreview && (
          <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 16, padding: 18, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>👯 {t("dash.wroteIn", { author: data.friendEntryPreview.authorName })} "{data.friendEntryPreview.journalTitle}"</div>
            <p style={{ fontSize: 13, marginTop: 8, color: "var(--text)", opacity: 0.85, fontStyle: "italic" }}>
              "{data.friendEntryPreview.text.slice(0, 140)}{data.friendEntryPreview.text.length > 140 ? "..." : ""}"
            </p>
            <div style={{ fontSize: 10, color: "rgba(232,220,198,0.4)", marginTop: 6 }}>
              {new Date(data.friendEntryPreview.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Daily challenges */}
        <div className="emovra-card-rise" style={{ animationDelay: "0.1s", marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🎯 {t("dash.todaysChallenges")}</h3>
          {data?.challenges?.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 18, padding: "12px 16px", marginBottom: 8 }}>
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
                <button onClick={() => claim(c.id)} disabled={claiming === c.id} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: claiming === c.id ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: claiming === c.id ? 0.7 : 1 }}>
                  {claiming === c.id && <span style={{ width: 10, height: 10, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "emovra-spin 0.7s linear infinite" }} />}
                  {claiming === c.id ? "Claiming..." : t("dash.claim")}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Sub-tabs - mobile fallback, sidebar handles this on desktop */}
        <div className="emovra-mobile-tabbar" style={{ gap: 6, flexWrap: "wrap", marginTop: 28, borderTop: "0.5px solid rgba(212,197,160,0.15)", paddingTop: 20 }}>
          {SUB_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: subTab === tab.id ? "1px solid var(--accent)" : "0.5px solid rgba(212,197,160,0.2)",
              background: subTab === tab.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: subTab === tab.id ? "var(--text-h)" : "rgba(232,220,198,0.6)",
              fontWeight: subTab === tab.id ? 700 : 500,
            }}>
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {subTab === "overview" && data?.habits?.count > 0 && (
            <div style={{ background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13 }}>
                🌱 {t("dash.habitsTracked", { count: data.habits.count, due: data.habits.dueToday })}
              </div>
            </div>
          )}

          {subTab === "habits-goals" && (
            <Suspense fallback={<Loader />}>
              <HabitTracker />
              <GoalPlanner />
              <GoalReminders />
            </Suspense>
          )}

          {subTab === "insights" && (
            <Suspense fallback={<Loader />}>
              <MentalHealthInsights />
              <WellnessCalendar />
              <PersonalityQuiz />
            </Suspense>
          )}

          {subTab === "relax" && (
            <Suspense fallback={<Loader />}>
              <RelaxationGames />
              <ZenGarden />
              <MusicTherapy />
              <SelfCareTools />
            </Suspense>
          )}

          {subTab === "mind" && (
            <Suspense fallback={<Loader />}>
              <CBTTools />
              <MindGames />
              <DigitalTimeMachine />
            </Suspense>
          )}

          {subTab === "creative" && (
            <Suspense fallback={<Loader />}>
              <CreativeCorner />
              <CreativeExpression />
              <FortuneCookie />
              <ComplimentGenerator />
            </Suspense>
          )}

          {subTab === "reflect" && (
            <Suspense fallback={<Loader />}>
              <SleepAssistant />
              <SocialSkills />
              <LifeTimeline />
              <ScheduledLetters />
              <DailyAffirmation />
              <SafetyPlan />
            </Suspense>
          )}

          {subTab === "settings" && (
            <Suspense fallback={<Loader />}>
              <ThemeAvatarSettings onProfileUpdate={loadQuiet} />
            </Suspense>
          )}
        </div>

        <button
          onClick={() => navigate("/app")}
          style={{ marginTop: 28, width: "100%", background: "var(--accent)", color: "#000", border: "none", padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          {t("dash.continueToEmovra")}
        </button>
        <Footer />
      </div>
        </div>
      </div>
    </div>
  );
}
