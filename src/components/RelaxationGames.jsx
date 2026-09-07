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
// Catch Falling Leaves - tap drifting leaves before they land, no fail state
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

function CatchLeaves() {
  const { t } = useLanguage();
  const [leaves, setLeaves] = useState([]);
  const [caught, setCaught] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem(LEAVES_BEST_KEY)) || 0; } catch { return 0; }
  });
  const idRef = useRef(0);

  // Difficulty ramps with how many you have caught: leaves fall faster,
  // spawn more often, and more share the screen. Capped at 6 so it plateaus
  // into "brisk but playable" rather than climbing until it is impossible -
  // this still lives in a wellness app, and an unwinnable game is a bad way
  // to spend a bad evening.
  const level = Math.min(6, 1 + Math.floor(caught / 8));

  // A streak multiplies what each leaf is worth, so paying attention pays
  // off. Missing one resets the streak but never takes points away - there
  // is still no fail state, just a reason to focus.
  const multiplier = Math.min(3, 1 + Math.floor(streak / 5));

  useEffect(() => {
    // Re-created whenever the level changes so the spawner never closes
    // over a stale difficulty.
    const spawnEvery = Math.max(450, 1300 - (level - 1) * 165);
    const maxOnScreen = 4 + level;
    const spawn = setInterval(() => {
      setLeaves((ls) => {
        if (ls.length >= maxOnScreen) return ls;
        const type = pickLeafType();
        const base = Math.max(2.4, 6.5 - (level - 1) * 0.72);
        return [
          ...ls,
          {
            id: idRef.current++,
            x: 8 + Math.random() * 80,
            // Golden leaves fall noticeably quicker - the bonus has to be
            // earned, not just collected.
            duration: (base + Math.random() * 1.6) * (type.golden ? 0.7 : 1),
            drift: Math.random() * 60 - 30,
            emoji: type.emoji,
            points: type.points,
            golden: !!type.golden,
          },
        ];
      });
    }, spawnEvery);
    return () => clearInterval(spawn);
  }, [level]);

  function catchLeaf(leaf) {
    setLeaves((ls) => ls.filter((l) => l.id !== leaf.id));
    setStreak((st) => st + 1);
    setScore((sc) => {
      const next = sc + leaf.points * multiplier;
      setBest((b) => {
        if (next <= b) return b;
        try { localStorage.setItem(LEAVES_BEST_KEY, String(next)); } catch { /* private mode */ }
        return next;
      });
      return next;
    });
    setCaught((c) => {
      const next = c + 1;
      if (next % 5 === 0) recordCalmMoment(1);
      return next;
    });
  }
  function landLeaf(id) {
    // A leaf reaching the bottom is the only "miss": it quietly ends the
    // streak. No sound, no flash, no penalty to the score.
    setLeaves((ls) => ls.filter((l) => l.id !== id));
    setStreak(0);
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
        {streak >= 2 && (
          <div style={{ position: "absolute", right: 10, top: 8, fontSize: 11, fontWeight: 700, color: "var(--text-h)" }}>
            {t("relaxationGames.leavesStreak", { streak })}
            {multiplier > 1 ? ` ×${multiplier}` : ""}
          </div>
        )}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
        {t("relaxationGames.leavesCaught", { count: caught })}
        {best > 0 ? ` · ${t("relaxationGames.leavesBest", { best })}` : ""}
      </p>
      <p style={{ marginTop: 4, fontSize: 12, opacity: 0.5 }}>{t("relaxationGames.leavesHint")}</p>
      <style>{`
        @keyframes emovra-leaf-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(120px) translateX(var(--ev-drift)) rotate(160deg); }
          100% { transform: translateY(270px) translateX(0) rotate(340deg); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// Connect Stars - tap stars in any order to draw a small constellation
// ------------------------------------------------------------------
// Laid out for a 100x150 viewBox (portrait). The y values are the original
// 90-unit layout scaled by 150/90, so the shape of the constellation is
// unchanged - it just uses the taller canvas rather than sitting squashed
// into the top third of it.
const STAR_POINTS = [
  { x: 20, y: 50 }, { x: 55, y: 25 }, { x: 85, y: 58 },
  { x: 70, y: 108 }, { x: 35, y: 125 }, { x: 12, y: 92 },
];

function ConnectStars() {
  const { t } = useLanguage();
  const [order, setOrder] = useState([]);

  function tapStar(i) {
    if (order.includes(i)) return;
    setOrder((o) => {
      const next = [...o, i];
      if (next.length === STAR_POINTS.length) recordCalmMoment(1);
      return next;
    });
  }
  function reset() {
    setOrder([]);
  }

  const done = order.length === STAR_POINTS.length;

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      {/* Portrait rather than landscape: the sky is taller than it is wide,
          so it reads as looking UP at a night sky on a phone. maxWidth is
          deliberately modest (340) - growing this horizontally was not the
          point; the extra room is vertical. aspectRatio matches the viewBox
          exactly so the stars stay round and land where they are drawn. */}
      <svg
        viewBox="0 0 100 150"
        width="100%"
        style={{
          margin: "0 auto", display: "block", maxWidth: 340, aspectRatio: "100 / 150",
          background: "linear-gradient(180deg, #0b1028, #1b2350)", borderRadius: 12,
        }}
      >
        {order.slice(1).map((idx, i) => {
          const a = STAR_POINTS[order[i]];
          const b = STAR_POINTS[idx];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(246,223,168,0.75)" strokeWidth="0.55" />;
        })}
        {STAR_POINTS.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={order.includes(i) ? 3.4 : 2.6}
            fill={order.includes(i) ? "#f6dfa8" : "#cdd3f2"}
            opacity={order.includes(i) ? 1 : 0.75}
            onClick={() => tapStar(i)}
            style={{ cursor: "pointer", transition: "r 0.3s ease" }}
          >
            {!done && <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />}
          </circle>
        ))}
      </svg>
      {done ? (
        <>
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>{t("relaxationGames.starsComplete")}</p>
          <button onClick={reset} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {t("relaxationGames.starsReset")}
          </button>
        </>
      ) : (
        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.55 }}>{t("relaxationGames.starsHint")}</p>
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
