import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { recordCalmMoment } from "../utils/calmGarden.js";

const BREATH_DURATIONS = [
  { id: 30, key: "relaxationGames.duration30" },
  { id: 60, key: "relaxationGames.duration60" },
  { id: 120, key: "relaxationGames.duration120" },
];

function BreathingFlower({ onComplete }) {
  const [phase, setPhase] = useState("in"); // in | hold | out
  const [running, setRunning] = useState(false);
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [justFinished, setJustFinished] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setPhase("in");
          setJustFinished(true);
          recordCalmMoment(duration / 60);
          if (onComplete) onComplete(duration);
          return 0;
        }
        return r - 1;
      });
      setPhaseSeconds((s) => {
        if (s > 1) return s - 1;
        setPhase((p) => (p === "in" ? "hold" : p === "hold" ? "out" : "in"));
        return 4;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    setJustFinished(false);
    setPhase("in");
    setPhaseSeconds(4);
    setRemaining(duration);
    setRunning(true);
  }

  const label = phase === "in" ? t("relaxationGames.breatheIn") : phase === "hold" ? t("relaxationGames.hold") : t("relaxationGames.breatheOut");
  const bloom = phase === "out" ? 0.55 : 1;
  const glowing = running && phase === "hold";
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ width: 220, height: 220, margin: "0 auto", position: "relative" }}>
        <svg viewBox="0 0 200 200" width="220" height="220" style={{ overflow: "visible" }}>
          <defs>
            <radialGradient id="ev-flower-petal" cx="50%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#fbdce8" />
              <stop offset="100%" stopColor="#d9799f" />
            </radialGradient>
            <radialGradient id="ev-flower-center" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#f6dfa8" />
              <stop offset="100%" stopColor="#d4b07a" />
            </radialGradient>
          </defs>
          <g
            style={{
              transformOrigin: "100px 100px",
              transform: `scale(${running ? bloom : 0.55})`,
              transition: "transform 3.8s ease-in-out, filter 1.2s ease",
              filter: glowing ? "drop-shadow(0 0 16px rgba(246,223,168,0.9))" : "drop-shadow(0 0 4px rgba(212,176,122,0.25))",
            }}
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse key={deg} cx="100" cy="62" rx="20" ry="40" fill="url(#ev-flower-petal)" opacity="0.92" transform={`rotate(${deg} 100 100)`} />
            ))}
            <circle cx="100" cy="100" r="22" fill="url(#ev-flower-center)" />
          </g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h)" }}>
            {running ? label : justFinished ? "🌸" : t("relaxationGames.ready")}
          </span>
          {running && <span style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{mm}:{ss}</span>}
        </div>
      </div>

      {!running && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {BREATH_DURATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDuration(d.id)}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
                border: duration === d.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: duration === d.id ? "rgba(212,176,122,0.15)" : "transparent",
                color: duration === d.id ? "var(--text-h)" : "var(--muted)",
                fontWeight: duration === d.id ? 700 : 500,
              }}
            >
              {t(d.key)}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={running ? () => setRunning(false) : start}
        style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}
      >
        {running ? t("relaxationGames.stop") : t("relaxationGames.startBreathing")}
      </button>
      {justFinished && !running && (
        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>{t("relaxationGames.sessionComplete")}</p>
      )}
    </div>
  );
}


function BubblePop() {
  const GRID = 30;
  const [popped, setPopped] = useState(() => new Array(GRID).fill(false));
  const { t } = useLanguage();

  function pop(i) {
    setPopped((arr) => {
      const next = [...arr];
      next[i] = true;
      return next;
    });
  }
  function reset() {
    setPopped(new Array(GRID).fill(false));
  }

  const allPopped = popped.every(Boolean);

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, maxWidth: 280, margin: "0 auto" }}>
        {popped.map((isPopped, i) => (
          <button
            key={i}
            onClick={() => !isPopped && pop(i)}
            disabled={isPopped}
            style={{
              width: 40, height: 40, borderRadius: "50%", border: "none", cursor: isPopped ? "default" : "pointer",
              background: isPopped ? "rgba(212,197,160,0.08)" : "radial-gradient(circle at 35% 30%, rgba(212,176,122,0.9), rgba(212,176,122,0.4))",
              transform: isPopped ? "scale(0.5)" : "scale(1)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
          />
        ))}
      </div>
      {allPopped ? (
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
          {t("relaxationGames.refillBubbles")}
        </button>
      ) : (
        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>{t("relaxationGames.bubblesPopped", { popped: popped.filter(Boolean).length, total: GRID })}</p>
      )}
    </div>
  );
}



// ------------------------------------------------------------------
// Catch Falling Leaves - a round-based game. Every leaf counts: one that
// reaches the ground ends the run.
// ------------------------------------------------------------------
// Leaf types. The golden one is rare and worth triple - something to
// actually watch for, rather than every leaf being identical.
const LEAF_TYPES = [
  { emoji: "🍃", points: 1, weight: 5 },
  { emoji: "🍂", points: 1, weight: 5 },
  { emoji: "🍁", points: 1, weight: 4 },
  { emoji: "🌟", points: 3, weight: 1, golden: true },
];
const LEAF_WEIGHT_TOTAL = LEAF_TYPES.reduce((n, l) => n + l.weight, 0);
function pickLeafType() {
  let r = Math.random() * LEAF_WEIGHT_TOTAL;
  for (const type of LEAF_TYPES) {
    r -= type.weight;
    if (r <= 0) return type;
  }
  return LEAF_TYPES[0];
}

const LEAVES_BEST_KEY = "emovra_leaves_best";
// Leaves to catch to clear a level.
const LEAVES_PER_LEVEL = 10;
// How long the "Level N" card sits over the board before play resumes.
const LEVEL_BANNER_MS = 1600;

// The difficulty curve. Now that a single miss ends the run, these numbers
// matter far more than they did when the game was endless and forgiving -
// a pace that was merely brisk before is lethal now, so both ends were
// re-tuned: level 1 is slower than the old level 1, and the ceiling is
// gentler than the old level 6. The floors are the important part. Below
// roughly a 3-second fall there is no reaction window left, and a game
// that becomes unwinnable is a poor thing to hand someone on a bad
// evening - so the curve plateaus into "demanding but fair" and the run
// ends because attention slipped, not because the game stopped being
// possible.
function levelSpeed(level) {
  return {
    spawnEvery: Math.max(620, 1500 - (level - 1) * 140),
    fallBase: Math.max(3.1, 7 - (level - 1) * 0.55),
    maxOnScreen: Math.min(7, 3 + level),
  };
}

function CatchLeaves() {
  const { t } = useLanguage();
  // intro   - the "Level N" card is up, board cleared, nothing spawning
  // playing - leaves falling
  // paused  - tab hidden mid-run (see the visibility effect below)
  // over    - a leaf landed
  const [phase, setPhase] = useState("intro");
  const [level, setLevel] = useState(1);
  const [leaves, setLeaves] = useState([]);
  const [caught, setCaught] = useState(0);
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem(LEAVES_BEST_KEY)) || 0; } catch { return 0; }
  });
  const idRef = useRef(0);
  // Score and level progress are kept in refs as well as state. Two leaves
  // can be tapped in the same frame, and both handlers would then read the
  // same stale render value - which would drop a point, or worse, let two
  // taps each trip the level-up threshold. The refs are the source of
  // truth; the state exists to render.
  const scoreRef = useRef(0);
  const caughtRef = useRef(0);
  // Two leaves can also finish falling in the same frame. Without this the
  // second would fire a second game-over on top of the first.
  const overRef = useRef(false);

  const { spawnEvery, fallBase, maxOnScreen } = levelSpeed(level);
  const runCaught = (level - 1) * LEAVES_PER_LEVEL + caught;
  const showingBanner = phase === "intro" || phase === "paused";

  // The level card doubles as the level's grace period: the board is empty
  // and nothing spawns while it is up, so a leaf can never land behind it
  // and end a run the player had no chance to save.
  useEffect(() => {
    if (phase !== "intro") return;
    const id = setTimeout(() => setPhase("playing"), LEVEL_BANNER_MS);
    return () => clearTimeout(id);
  }, [phase, level]);

  useEffect(() => {
    if (phase !== "playing") return;
    const spawn = setInterval(() => {
      setLeaves((ls) => {
        if (ls.length >= maxOnScreen) return ls;
        const type = pickLeafType();
        return [
          ...ls,
          {
            id: idRef.current++,
            x: 8 + Math.random() * 80,
            // Golden leaves fall quicker, so the bonus is a risk as much as
            // a reward - missing one now costs the whole run.
            duration: (fallBase + Math.random() * 1.5) * (type.golden ? 0.8 : 1),
            drift: Math.random() * 60 - 30,
            emoji: type.emoji,
            points: type.points,
            golden: !!type.golden,
          },
        ];
      });
    }, spawnEvery);
    return () => clearInterval(spawn);
  }, [phase, spawnEvery, maxOnScreen, fallBase]);

  // Leaving the tab must not kill the run. Browsers keep CSS animations
  // running on wall-clock time for a hidden tab, so without this a student
  // who glances at a notification comes back to a game they already lost
  // while not looking at it. Hiding parks the run; returning replays the
  // level card and starts that level's leaves fresh.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        if (phase === "playing") {
          setLeaves([]);
          setPhase("paused");
        }
      } else if (phase === "paused") {
        setPhase("intro");
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  function catchLeaf(leaf) {
    if (phase !== "playing") return;
    setLeaves((ls) => ls.filter((l) => l.id !== leaf.id));

    // Each leaf is worth its face value times the current level, which is
    // what makes surviving to level 5 better than farming level 1.
    scoreRef.current += leaf.points * level;
    setScore(scoreRef.current);

    caughtRef.current += 1;
    if (caughtRef.current >= LEAVES_PER_LEVEL) {
      // Clearing the board on level-up is deliberate: leaves already in
      // flight would otherwise land during the level card.
      caughtRef.current = 0;
      setCaught(0);
      setLeaves([]);
      setLevel((lv) => lv + 1);
      setPhase("intro");
      recordCalmMoment(1);
    } else {
      setCaught(caughtRef.current);
    }
  }

  function landLeaf(id) {
    setLeaves((ls) => ls.filter((l) => l.id !== id));
    if (phase !== "playing" || overRef.current) return;
    overRef.current = true;
    const finalScore = scoreRef.current;
    if (finalScore > best) {
      setBest(finalScore);
      setNewBest(true);
      try { localStorage.setItem(LEAVES_BEST_KEY, String(finalScore)); } catch { /* private mode */ }
    }
    setLeaves([]);
    setPhase("over");
  }

  function playAgain() {
    scoreRef.current = 0;
    caughtRef.current = 0;
    overRef.current = false;
    setScore(0);
    setCaught(0);
    setLevel(1);
    setNewBest(false);
    setLeaves([]);
    setPhase("intro");
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ position: "relative", height: 240, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg, rgba(212,176,122,0.05), rgba(212,176,122,0.14))" }}>
        {leaves.map((l) => (
          <span
            key={l.id}
            onClick={() => catchLeaf(l)}
            onAnimationEnd={() => landLeaf(l.id)}
            style={{
              position: "absolute", left: `${l.x}%`, top: -30,
              fontSize: l.golden ? 30 : 26, cursor: "pointer",
              filter: l.golden ? "drop-shadow(0 0 10px rgba(246,223,168,0.95))" : "none",
              "--ev-drift": `${l.drift}px`,
              animation: `emovra-leaf-fall ${l.duration}s linear forwards`,
            }}
          >
            {l.emoji}
          </span>
        ))}

        <div style={{ position: "absolute", left: 10, top: 8, fontSize: 11, opacity: 0.75, textAlign: "left", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: "var(--text-h)" }}>{t("relaxationGames.leavesScore", { score })}</div>
          <div>{t("relaxationGames.leavesLevel", { level })}</div>
        </div>
        <div style={{ position: "absolute", right: 10, top: 8, fontSize: 11, fontWeight: 700, opacity: 0.75, color: "var(--text-h)", fontVariantNumeric: "tabular-nums" }}>
          {caught} / {LEAVES_PER_LEVEL}
        </div>

        {/* Both overlays paint their own text colours rather than taking them
            from the theme: the scrim is a fixed dark panel, and a custom or
            image-derived theme can have a dark accent, which would render
            this card as dark text on a dark ground. */}
        {showingBanner && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 3,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            background: "rgba(8,9,14,0.78)", animation: "emovra-level-in 0.35s ease-out",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              {t("relaxationGames.leavesLevelLabel")}
            </div>
            <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1, color: "#f6dfa8" }}>{level}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              {t("relaxationGames.leavesLevelGoal", { count: LEAVES_PER_LEVEL })}
            </div>
          </div>
        )}

        {phase === "over" && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 3,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            background: "rgba(8,9,14,0.82)", animation: "emovra-level-in 0.35s ease-out",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
              {t("relaxationGames.leavesMissed")}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, color: "#f6dfa8" }}>{score}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {t("relaxationGames.leavesRunSummary", { count: runCaught, level })}
            </div>
            {newBest && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f6dfa8", marginTop: 2 }}>
                {t("relaxationGames.leavesNewBest")}
              </div>
            )}
            {/* The hairline ring keeps the button's shape visible on the dark
                scrim even if a custom theme's accent happens to be dark. */}
            <button onClick={playAgain} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 0 1px rgba(255,255,255,0.25)" }}>
              {t("relaxationGames.leavesPlayAgain")}
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
        {t("relaxationGames.leavesCaught", { count: runCaught })}
        {best > 0 ? ` · ${t("relaxationGames.leavesBest", { best })}` : ""}
      </p>
      <p style={{ marginTop: 4, fontSize: 12, opacity: 0.5 }}>{t("relaxationGames.leavesHint")}</p>
      <style>{`
        @keyframes emovra-leaf-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(120px) translateX(var(--ev-drift)) rotate(160deg); }
          100% { transform: translateY(270px) translateX(0) rotate(340deg); }
        }
        @keyframes emovra-level-in {
          0% { opacity: 0; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// Connect Stars - tap stars in any order to draw a small constellation
// ------------------------------------------------------------------
const STAR_POINTS = [
  { x: 20, y: 30 }, { x: 55, y: 15 }, { x: 85, y: 35 },
  { x: 70, y: 65 }, { x: 35, y: 75 }, { x: 12, y: 55 },
];

function ConnectStars() {
  const { t } = useLanguage();
  const [order, setOrder] = useState([]);
  // The drawing used to end itself the moment all six stars were lit, which
  // is what made each star a one-shot: revisiting one could never have
  // finished the picture. Now the player says when it is done, so a star can
  // be passed through as many times as the line wants.
  const [finished, setFinished] = useState(false);

  // A soft ceiling on path length. Nobody doodling will reach it - it only
  // stops the segment array from growing without bound if a tap is held down
  // or a child simply keeps going.
  const MAX_SEGMENTS = 100;

  function tapStar(i) {
    if (finished) return;
    setOrder((o) => {
      // Tapping the star the line is already sitting on would add a segment
      // of zero length - nothing to see, so nothing to add.
      if (o.length && o[o.length - 1] === i) return o;
      if (o.length >= MAX_SEGMENTS) return o;
      return [...o, i];
    });
  }
  function finish() {
    if (order.length < 2) return;
    setFinished(true);
    recordCalmMoment(1);
  }
  function reset() {
    setOrder([]);
    setFinished(false);
  }

  const canFinish = order.length >= 2;

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <svg viewBox="0 0 100 90" width="260" height="234" style={{ margin: "0 auto", display: "block", background: "linear-gradient(180deg, #0e1330, #1b2350)", borderRadius: 12 }}>
        {order.slice(1).map((idx, i) => {
          const a = STAR_POINTS[order[i]];
          const b = STAR_POINTS[idx];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(246,223,168,0.75)" strokeWidth="0.6" />;
        })}
        {STAR_POINTS.map((p, i) => {
          const lit = order.includes(i);
          // The star the line is currently resting on, drawn a touch larger
          // so it is obvious where the next segment will start from - which
          // matters much more now that the path can double back.
          const current = !finished && order.length > 0 && order[order.length - 1] === i;
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r={current ? 3.8 : lit ? 3.2 : 2.4}
              fill={lit ? "#f6dfa8" : "#cdd3f2"}
              opacity={lit ? 1 : 0.75}
              stroke={current ? "rgba(246,223,168,0.55)" : "none"}
              strokeWidth={current ? 1.4 : 0}
              onClick={() => tapStar(i)}
              style={{ cursor: finished ? "default" : "pointer", transition: "r 0.3s ease" }}
            >
              {!finished && <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />}
            </circle>
          );
        })}
      </svg>
      {finished ? (
        <>
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>{t("relaxationGames.starsComplete")}</p>
          <button onClick={reset} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {t("relaxationGames.starsReset")}
          </button>
        </>
      ) : (
        <>
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.55 }}>{t("relaxationGames.starsHint")}</p>
          <button
            onClick={finish}
            disabled={!canFinish}
            style={{
              marginTop: 8, padding: "8px 20px", borderRadius: 999, border: "none",
              background: canFinish ? "var(--accent)" : "rgba(140,140,150,0.25)",
              color: canFinish ? "#000" : "rgba(140,140,150,0.9)",
              fontWeight: 700, cursor: canFinish ? "pointer" : "default",
              transition: "background 0.25s ease, color 0.25s ease",
            }}
          >
            {t("relaxationGames.starsFinish")}
          </button>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Trace a Shape - a soft light slowly follows a spiral; tap to pause/resume
// ------------------------------------------------------------------
const TRACE_PATH = "M100,60 C130,60 140,90 120,105 C95,123 60,110 60,85 C60,60 90,45 115,55 C150,68 155,110 120,132 C85,153 40,135 35,95";

function TraceShape() {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(true);
  const [duration, setDuration] = useState(14);
  const svgRef = useRef(null);

  // FIX: tapping said "Paused. Tap to resume." but the dot kept going.
  // The pause was attempted by conditionally spreading begin:"indefinite"
  // onto <animateMotion>, and `begin` is a declarative START-TIME
  // attribute - it decides when an animation may begin, and only matters
  // while the element is being set up. Re-rendering it onto an animation
  // that is already running does nothing at all, so the only thing the tap
  // ever changed was the caption underneath.
  //
  // SMIL is controlled through the DOM, not through attributes: pause and
  // unpause live on the <svg> root.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (playing) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [playing]);

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <svg ref={svgRef} viewBox="0 0 190 190" width="220" height="220" style={{ margin: "0 auto", display: "block", cursor: "pointer" }} onClick={() => setPlaying((p) => !p)}>
        <path d={TRACE_PATH} fill="none" stroke="rgba(212,176,122,0.28)" strokeWidth="3" strokeLinecap="round" />
        <circle r="5" fill="#f6dfa8" style={{ filter: "drop-shadow(0 0 6px rgba(246,223,168,0.9))" }}>
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={TRACE_PATH}
            rotate="auto"
          />
        </circle>
      </svg>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
        {[10, 14, 20].map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: duration === d ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: duration === d ? "rgba(212,176,122,0.15)" : "transparent",
              color: duration === d ? "var(--text-h)" : "var(--muted)",
              fontWeight: duration === d ? 700 : 500,
            }}
          >
            {d === 10 ? t("relaxationGames.tracePaceCalm") : d === 14 ? t("relaxationGames.tracePaceSlower") : t("relaxationGames.tracePaceSlowest")}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>{playing ? t("relaxationGames.traceHintPlaying") : t("relaxationGames.traceHintPaused")}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// Match Peaceful Colors - low-pressure memory match with a pastel palette
// ------------------------------------------------------------------
const COLOR_PAIRS = ["#f6dfa8", "#d9799f", "#9fd0c7", "#b9a6e0", "#f2b6a0", "#a8c8e8"];

function shuffledDeck() {
  const deck = [...COLOR_PAIRS, ...COLOR_PAIRS].map((color, i) => ({ id: i, color }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function MatchColors() {
  const { t } = useLanguage();
  const [deck, setDeck] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [busy, setBusy] = useState(false);

  function tapCard(id) {
    if (busy || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      const [a, b] = next;
      const cardA = deck.find((c) => c.id === a);
      const cardB = deck.find((c) => c.id === b);
      if (cardA.color === cardB.color) {
        setTimeout(() => {
          setMatched((m) => {
            const next = [...m, a, b];
            if (next.length === deck.length) recordCalmMoment(1);
            return next;
          });
          setFlipped([]);
          setBusy(false);
        }, 450);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 750);
      }
    }
  }
  function reshuffle() {
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched([]);
    setBusy(false);
  }

  const allMatched = matched.length === deck.length;

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 260, margin: "0 auto" }}>
        {deck.map((card) => {
          const isUp = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => tapCard(card.id)}
              style={{
                width: 52, height: 52, borderRadius: 10, cursor: matched.includes(card.id) ? "default" : "pointer",
                border: "none",
                background: isUp ? card.color : "rgba(212,176,122,0.18)",
                opacity: matched.includes(card.id) ? 0.55 : 1,
                transition: "background 0.3s ease, transform 0.2s ease",
                transform: isUp ? "scale(1)" : "scale(0.96)",
              }}
            />
          );
        })}
      </div>
      {allMatched ? (
        <>
          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>{t("relaxationGames.colorsComplete")}</p>
          <button onClick={reshuffle} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {t("relaxationGames.colorsReshuffle")}
          </button>
        </>
      ) : (
        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.55 }}>{t("relaxationGames.colorsHint")}</p>
      )}
    </div>
  );
}

const GAMES = [
  { id: "breathe", emoji: "🌸", labelKey: "relaxationGames.breathingTab", Component: BreathingFlower },
  { id: "pop", emoji: "🫧", labelKey: "relaxationGames.bubblePopTab", Component: BubblePop },
  { id: "leaves", emoji: "🍂", labelKey: "relaxationGames.leavesTab", Component: CatchLeaves },
  { id: "stars", emoji: "✨", labelKey: "relaxationGames.starsTab", Component: ConnectStars },
  { id: "trace", emoji: "〰️", labelKey: "relaxationGames.traceTab", Component: TraceShape },
  { id: "colors", emoji: "🎨", labelKey: "relaxationGames.colorsTab", Component: MatchColors },
];

export default function RelaxationGames() {
  const [active, setActive] = useState("breathe");
  const { t } = useLanguage();
  const ActiveGame = GAMES.find((g) => g.id === active)?.Component;

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🎮 {t("relaxationGames.heading")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("relaxationGames.subtitle")}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g.id)}
            style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: active === g.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: active === g.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: active === g.id ? "var(--text-h)" : "var(--muted)",
              fontWeight: active === g.id ? 700 : 500,
            }}
          >
            {g.emoji} {t(g.labelKey)}
          </button>
        ))}
      </div>
      {ActiveGame && <ActiveGame />}
    </div>
  );
}
