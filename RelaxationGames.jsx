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

function StressBall() {
  const [squished, setSquished] = useState(false);
  const [pops, setPops] = useState(0);
  const { t } = useLanguage();
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div
        onMouseDown={() => { setSquished(true); setPops((p) => p + 1); }}
        onMouseUp={() => setSquished(false)}
        onMouseLeave={() => setSquished(false)}
        onTouchStart={() => { setSquished(true); setPops((p) => p + 1); }}
        onTouchEnd={() => setSquished(false)}
        style={{
          width: 130, height: 130, margin: "0 auto", borderRadius: "50%", cursor: "pointer", userSelect: "none",
          background: "radial-gradient(circle at 35% 30%, #f4a261, #e07a3f)",
          transform: squished ? "scale(0.82, 1.15)" : "scale(1,1)",
          transition: "transform 0.15s ease",
          boxShadow: squished ? "0 2px 8px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.25)",
        }}
      />
      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>{t("relaxationGames.stressBallHint", { count: pops })}</p>
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
// Arrange Stones - tap to add a stone to a gently wobbling cairn
// ------------------------------------------------------------------
const STONE_COLORS = ["#c9b79c", "#b3a58f", "#9e9483", "#ada398", "#8f8779", "#c2b49b"];

function ArrangeStones() {
  const { t } = useLanguage();
  const [stack, setStack] = useState([]);
  const nextId = useRef(0);

  function addStone() {
    setStack((s) => {
      if (s.length >= 8) return s;
      const id = nextId.current++;
      return [
        ...s,
        {
          id,
          width: 92 - s.length * 8 + (Math.random() * 8 - 4),
          offsetX: Math.random() * 14 - 7,
          rotate: Math.random() * 8 - 4,
          color: STONE_COLORS[s.length % STONE_COLORS.length],
        },
      ];
    });
  }
  function clear() {
    if (stack.length >= 4) recordCalmMoment(1);
    setStack([]);
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ minHeight: 220, display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 4, padding: "10px 0", justifyContent: "flex-start" }}>
        {stack.map((st) => (
          <div
            key={st.id}
            style={{
              width: Math.max(30, st.width), height: 24, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 25%, ${st.color}, #00000030)`,
              transform: `translateX(${st.offsetX}px) rotate(${st.rotate}deg)`,
              boxShadow: "0 3px 6px rgba(0,0,0,0.18)",
              transition: "transform 0.4s ease",
            }}
          />
        ))}
      </div>
      <button
        onClick={addStone}
        disabled={stack.length >= 8}
        style={{ marginTop: 8, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: stack.length >= 8 ? "default" : "pointer", opacity: stack.length >= 8 ? 0.5 : 1 }}
      >
        {t("relaxationGames.addStone")}
      </button>
      {stack.length > 0 && (
        <p onClick={clear} style={{ marginTop: 10, fontSize: 12, opacity: 0.6, cursor: "pointer", textDecoration: "underline" }}>
          {t("relaxationGames.clearStack")}
        </p>
      )}
      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.5 }}>{t("relaxationGames.stonesHint")}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// Catch Falling Leaves - tap drifting leaves before they land, no fail state
// ------------------------------------------------------------------
const LEAF_EMOJIS = ["🍃", "🍂", "🍁"];

function CatchLeaves() {
  const { t } = useLanguage();
  const [leaves, setLeaves] = useState([]);
  const [caught, setCaught] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = setInterval(() => {
      setLeaves((ls) => {
        if (ls.length >= 5) return ls;
        const id = idRef.current++;
        return [
          ...ls,
          {
            id,
            x: 8 + Math.random() * 80,
            duration: 6 + Math.random() * 4,
            drift: Math.random() * 40 - 20,
            emoji: LEAF_EMOJIS[Math.floor(Math.random() * LEAF_EMOJIS.length)],
          },
        ];
      });
    }, 1300);
    return () => clearInterval(spawn);
  }, []);

  function catchLeaf(id) {
    setLeaves((ls) => ls.filter((l) => l.id !== id));
    setCaught((c) => {
      const next = c + 1;
      if (next % 5 === 0) recordCalmMoment(1);
      return next;
    });
  }
  function landLeaf(id) {
    setLeaves((ls) => ls.filter((l) => l.id !== id));
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ position: "relative", height: 240, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg, rgba(212,176,122,0.05), rgba(212,176,122,0.14))" }}>
        {leaves.map((l) => (
          <span
            key={l.id}
            onClick={() => catchLeaf(l.id)}
            onAnimationEnd={() => landLeaf(l.id)}
            style={{
              position: "absolute", left: `${l.x}%`, top: -30, fontSize: 26, cursor: "pointer",
              "--ev-drift": `${l.drift}px`,
              animation: `emovra-leaf-fall ${l.duration}s linear forwards`,
            }}
          >
            {l.emoji}
          </span>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>{t("relaxationGames.leavesCaught", { count: caught })}</p>
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
const STAR_POINTS = [
  { x: 20, y: 30 }, { x: 55, y: 15 }, { x: 85, y: 35 },
  { x: 70, y: 65 }, { x: 35, y: 75 }, { x: 12, y: 55 },
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
      <svg viewBox="0 0 100 90" width="260" height="234" style={{ margin: "0 auto", display: "block", background: "linear-gradient(180deg, #0e1330, #1b2350)", borderRadius: 12 }}>
        {order.slice(1).map((idx, i) => {
          const a = STAR_POINTS[order[i]];
          const b = STAR_POINTS[idx];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(246,223,168,0.75)" strokeWidth="0.6" />;
        })}
        {STAR_POINTS.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={order.includes(i) ? 3.2 : 2.4}
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

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <svg viewBox="0 0 190 190" width="220" height="220" style={{ margin: "0 auto", display: "block", cursor: "pointer" }} onClick={() => setPlaying((p) => !p)}>
        <path d={TRACE_PATH} fill="none" stroke="rgba(212,176,122,0.28)" strokeWidth="3" strokeLinecap="round" />
        <circle r="5" fill="#f6dfa8" style={{ filter: "drop-shadow(0 0 6px rgba(246,223,168,0.9))" }}>
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={TRACE_PATH}
            rotate="auto"
            {...(playing ? {} : { begin: "indefinite" })}
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
  { id: "ball", emoji: "🤏", labelKey: "relaxationGames.stressBallTab", Component: StressBall },
  { id: "pop", emoji: "🫧", labelKey: "relaxationGames.bubblePopTab", Component: BubblePop },
  { id: "stones", emoji: "🪨", labelKey: "relaxationGames.stonesTab", Component: ArrangeStones },
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
