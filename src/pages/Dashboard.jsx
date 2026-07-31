import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

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

const API = "https://emovra.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const Loader = () => <div style={{ padding: 12, textAlign: "center", color: "var(--text-h)", fontSize: 11 }}>Loading...</div>;

const SUB_TABS = [
  { id: "overview", label: "Overview" },
  { id: "habits-goals", label: "Habits & Goals" },
  { id: "insights", label: "Insights" },
  { id: "wellness", label: "Wellness Tools" },
  { id: "settings", label: "Settings" },
];

export default function Dashboard() {
  const navigate = useNavigate();
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
        if (json.newBadges?.length) {
          setToast(`🎉 New badge: ${json.newBadges.map((b) => b.name).join(", ")}!`);
          setTimeout(() => setToast(null), 4000);
        } else if (json.leveledUp) {
          setToast(`🎉 Level up! You're now level ${json.level}`);
          setTimeout(() => setToast(null), 4000);
        }
        await load();
      } else {
        alert(json.message || "Could not claim");
      }
    } catch {}
    setClaiming(null);
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Inter, sans-serif", padding: "32px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#000", padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            {toast}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 40, width: 56, height: 56, borderRadius: "50%", background: "rgba(212,197,160,0.1)", border: "1px solid rgba(212,197,160,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {data?.avatar || "🦋"}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 34, margin: 0 }}>
                Welcome back{data?.name ? `, ${data.name.split(" ")[0]}` : ""} 👋
              </h1>
              <p style={{ color: "rgba(232,220,198,0.6)", fontSize: 13, marginTop: 6 }}>
                Here's where you're at today.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app")}
            style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Continue to Emovra →
          </button>
        </div>

        {/* Level / XP / Streak - always visible, this is the core of the dashboard */}
        <div style={{ background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.18)", borderRadius: 16, padding: 20, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-h)" }}>Level {g?.level || 1}</div>
              <div style={{ fontSize: 12, color: "rgba(232,220,198,0.5)" }}>{g?.xp || 0} XP</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", padding: "8px 16px", borderRadius: 999 }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{g?.streakDays || 0}</span>
              <span style={{ fontSize: 11, color: "rgba(232,220,198,0.6)" }}>day streak</span>
            </div>
          </div>
          <div style={{ marginTop: 14, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--text))", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(232,220,198,0.4)", marginTop: 6 }}>{progressPct}% to level {(g?.level || 1) + 1}</div>
        </div>

        {data?.isBirthdayToday && (
          <div style={{ background: "linear-gradient(135deg, rgba(212,176,122,0.2), rgba(168,85,247,0.12))", border: "1px solid var(--accent)", borderRadius: 16, padding: 20, marginTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>🎂🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6, color: "var(--text-h)" }}>Happy Birthday{data?.name ? `, ${data.name.split(" ")[0]}` : ""}!</div>
            <p style={{ fontSize: 12, marginTop: 4, color: "rgba(232,220,198,0.7)" }}>Hope today treats you gently. We're glad you're here.</p>
          </div>
        )}

        {data?.earlyWarning?.triggered && (
          <div style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.35)", borderRadius: 16, padding: 18, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fb923c" }}>💛 A gentle check-in</div>
            <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{data.earlyWarning.message}</p>
            <a href="tel:14416" style={{ display: "inline-block", marginTop: 10, background: "var(--accent)", color: "#000", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
              📞 Tele-MANAS: 14416
            </a>
          </div>
        )}

        {data?.friendEntryPreview && (
          <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 16, padding: 18, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>👯 {data.friendEntryPreview.authorName} wrote in "{data.friendEntryPreview.journalTitle}"</div>
            <p style={{ fontSize: 13, marginTop: 8, color: "var(--text)", opacity: 0.85, fontStyle: "italic" }}>
              "{data.friendEntryPreview.text.slice(0, 140)}{data.friendEntryPreview.text.length > 140 ? "..." : ""}"
            </p>
            <div style={{ fontSize: 10, color: "rgba(232,220,198,0.4)", marginTop: 6 }}>
              {new Date(data.friendEntryPreview.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Daily challenges */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🎯 Today's Challenges</h3>
          {data?.challenges?.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(232,220,198,0.5)" }}>+{c.xp} XP</div>
                </div>
              </div>
              {c.claimed ? (
                <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>✓ Done</span>
              ) : (
                <button onClick={() => claim(c.id)} disabled={claiming === c.id} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  {claiming === c.id ? "..." : "Claim"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Badges */}
        {g?.badges?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>🏅 Your Badges</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {g.badges.map((b) => (
                <div key={b.id} title={b.description} style={{ background: "rgba(212,197,160,0.1)", border: "1px solid rgba(212,197,160,0.25)", borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 90 }}>
                  <div style={{ fontSize: 22 }}>{b.emoji}</div>
                  <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: sub-tabs for everything moved out of the main app */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 28, borderTop: "0.5px solid rgba(212,197,160,0.15)", paddingTop: 20 }}>
          {SUB_TABS.map((t) => (
            <button key={t.id} onClick={() => setSubTab(t.id)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: subTab === t.id ? "1px solid var(--accent)" : "0.5px solid rgba(212,197,160,0.2)",
              background: subTab === t.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: subTab === t.id ? "var(--text-h)" : "rgba(232,220,198,0.6)",
              fontWeight: subTab === t.id ? 700 : 500,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {subTab === "overview" && data?.habits?.count > 0 && (
            <div style={{ background: "var(--card-bg)", border: "0.5px solid rgba(212,197,160,0.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13 }}>
                🌱 You have <b>{data.habits.count}</b> habit{data.habits.count !== 1 ? "s" : ""} tracked, <b>{data.habits.dueToday}</b> due today. See the Habits & Goals tab.
              </div>
            </div>
          )}

          {subTab === "habits-goals" && (
            <Suspense fallback={<Loader />}>
              <HabitTracker />
              <GoalPlanner />
            </Suspense>
          )}

          {subTab === "insights" && (
            <Suspense fallback={<Loader />}>
              <MentalHealthInsights />
              <WellnessCalendar />
              <PersonalityQuiz />
            </Suspense>
          )}

          {subTab === "wellness" && (
            <Suspense fallback={<Loader />}>
              <SleepAssistant />
              <CreativeCorner />
              <MusicTherapy />
            </Suspense>
          )}

          {subTab === "settings" && (
            <Suspense fallback={<Loader />}>
              <ThemeAvatarSettings />
            </Suspense>
          )}
        </div>

        <button
          onClick={() => navigate("/app")}
          style={{ marginTop: 28, width: "100%", background: "var(--accent)", color: "#000", border: "none", padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          Continue to Emovra →
        </button>
      </div>
    </div>
  );
}
