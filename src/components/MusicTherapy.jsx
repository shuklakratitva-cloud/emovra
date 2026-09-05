import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";

function useAmbientSound() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const intervalsRef = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState("rain");

  function stop() {
    nodesRef.current.forEach((n) => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    nodesRef.current = [];
    intervalsRef.current.forEach((id) => clearInterval(id));
    intervalsRef.current = [];
    setPlaying(false);
  }

  // FIX: nothing tore this down on unmount. Starting Rain/Fireplace/Forest
  // in the Sanctuary and then navigating to another dashboard section
  // unmounted the component along with its Stop button, while the
  // oscillators kept playing and the fireplace/forest setIntervals kept
  // allocating new Web Audio nodes every ~220ms - unstoppable without a
  // full page reload, which is a bad failure mode for a calming feature.
  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => { try { n.stop?.(); n.disconnect?.(); } catch {} });
      nodesRef.current = [];
      intervalsRef.current.forEach((id) => clearInterval(id));
      intervalsRef.current = [];
      try { ctxRef.current?.close(); } catch {}
      ctxRef.current = null;
    };
  }, []);

  function makeNoiseBuffer(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function burst(ctx, master, freq, dur) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(filter).connect(g).connect(master);
    src.start();
  }

  function chirp(ctx, master) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1800 + Math.random() * 1200;
    g.gain.value = 0;
    osc.connect(g).connect(master);
    osc.start();
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.25, now + 0.02);
    g.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.stop(now + 0.2);
  }

  function clink(ctx, master) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3500 + Math.random() * 2000;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(filter).connect(g).connect(master);
    src.start();
  }

  function start(soundKind) {
    stop();
    const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);

    if (soundKind === "rain" || soundKind === "white-noise" || soundKind === "forest" || soundKind === "cafe") {
      const noise = ctx.createBufferSource();
      noise.buffer = makeNoiseBuffer(ctx);
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      if (soundKind === "rain") { filter.type = "highpass"; filter.frequency.value = 800; }
      else if (soundKind === "white-noise") { filter.type = "lowpass"; filter.frequency.value = 2000; }
      else if (soundKind === "forest") { filter.type = "bandpass"; filter.frequency.value = 900; filter.Q.value = 0.5; }
      else { filter.type = "bandpass"; filter.frequency.value = 220; filter.Q.value = 1.1; }
      noise.connect(filter);

      if (soundKind === "cafe") {

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine"; lfo.frequency.value = 0.15;
        lfoGain.gain.value = 0.08;
        const wobble = ctx.createGain();
        wobble.gain.value = 0.85;
        lfo.connect(lfoGain).connect(wobble.gain);
        lfo.start();
        filter.connect(wobble).connect(master);
        nodesRef.current = [noise, filter, master, lfo, lfoGain, wobble];
      } else {
        filter.connect(master);
        nodesRef.current = [noise, filter, master];
      }
      noise.start();

      if (soundKind === "forest") {
        const id = setInterval(() => { if (Math.random() > 0.3) chirp(ctx, master); }, 1100);
        intervalsRef.current = [id];
      } else if (soundKind === "cafe") {
        const id = setInterval(() => { if (Math.random() > 0.4) clink(ctx, master); }, 2600);
        intervalsRef.current = [id];
      }
    } else if (soundKind === "fireplace") {

      const osc = ctx.createOscillator();
      osc.type = "sine"; osc.frequency.value = 90;
      const g = ctx.createGain(); g.gain.value = 0.3;
      osc.connect(g).connect(master);
      osc.start();
      nodesRef.current = [osc, g, master];
      const id = setInterval(() => burst(ctx, master, 2000 + Math.random() * 2000, 0.05 + Math.random() * 0.05), 220);
      intervalsRef.current = [id];
    } else {

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine"; osc2.type = "sine";
      osc1.frequency.value = 220; osc2.frequency.value = 221.5;
      osc1.connect(master); osc2.connect(master);
      osc1.start(); osc2.start();
      nodesRef.current = [osc1, osc2, master];
    }
    setKind(soundKind);
    setPlaying(true);
  }

  // FIX: the "find music for your mood" buttons used to only open a
  // YouTube/Spotify search in a new tab - nothing played inside the app
  // itself. Real licensed songs can't be bundled or fetched from here,
  // so instead this generates a short, gentle looping tone per mood
  // using the same Web Audio synthesis as the ambient sounds above -
  // it's not the actual song, but it's real audio that plays in-app the
  // moment you tap it, no new tab required. The external search links
  // stay too, for finding an actual track.
  function startMoodTone(mood) {
    stop();
    const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);

    const PRESETS = {
      calm: { freqs: [174.61, 220.0], lfoRate: 0.06, filter: 1200, filterQ: 0.4 },
      sad: { freqs: [196.0, 233.08], lfoRate: 0.05, filter: 900, filterQ: 0.5 },
      anxious: { freqs: [164.81, 196.0], lfoRate: 0.045, filter: 800, filterQ: 0.6 },
      sleepy: { freqs: [110.0, 130.81], lfoRate: 0.03, filter: 500, filterQ: 0.3 },
      energize: { freqs: [220.0, 277.18, 329.63], lfoRate: 0.08, filter: 2200, filterQ: 0.4 },
      focus: { freqs: [196.0, 246.94], lfoRate: 0.1, filter: 1600, filterQ: 0.3 },
    };
    const preset = PRESETS[mood] || PRESETS.calm;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset.filter;
    filter.Q.value = preset.filterQ;
    filter.connect(master);

    const voiceNodes = [];
    preset.freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g).connect(filter);
      osc.start();
      // fade in instead of snapping straight to volume, so it doesn't click/pop
      g.gain.linearRampToValueAtTime(0.5 / preset.freqs.length, ctx.currentTime + 1.5);
      voiceNodes.push(osc, g);
    });

    // slow breathing-like swell on the overall volume so it doesn't sit
    // there as a flat, static tone
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = preset.lfoRate;
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    nodesRef.current = [...voiceNodes, filter, master, lfo, lfoGain];
    setKind(`mood:${mood}`);
    setPlaying(true);
  }

  return { playing, kind, start, startMoodTone, stop };
}

// FIX: this used to be a single giant 🕯️ emoji floating on nothing -
// renders inconsistently across devices/fonts and looks flat rather than
// calming. Replaced with a small hand-drawn SVG candle (gradient flame,
// soft glow, wax body) that matches the app's gold/dark theme, and made
// it tappable: tapping sends a gust through the flame and a few sparks
// drifting up, instead of just sitting there looping forever.
function VirtualCandle() {
  const { t } = useLanguage();
  const [gusting, setGusting] = useState(false);
  const [sparks, setSparks] = useState([]);

  function handleTap() {
    setGusting(true);
    setTimeout(() => setGusting(false), 900);
    const id = Date.now();
    const burst = Array.from({ length: 5 }, (_, i) => ({
      id: id + i,
      dx: (Math.random() - 0.5) * 40,
      delay: Math.random() * 0.2,
      duration: 1.1 + Math.random() * 0.6,
    }));
    setSparks((s) => [...s, ...burst]);
    setTimeout(() => setSparks((s) => s.filter((sp) => !burst.some((b) => b.id === sp.id))), 2000);
  }

  return (
    <div style={{ textAlign: "center", padding: "16px 0", cursor: "pointer" }} onClick={handleTap} role="button" tabIndex={0}>
      <svg width="72" height="112" viewBox="0 0 72 112" style={{ overflow: "visible", filter: "drop-shadow(0 0 20px rgba(255,176,85,0.35))" }}>
        <defs>
          <radialGradient id="ev-flame-core" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff6d8" />
            <stop offset="35%" stopColor="#ffcf5c" />
            <stop offset="75%" stopColor="#ff8a3d" />
            <stop offset="100%" stopColor="#e0592a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ev-wax" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6ecd9" />
            <stop offset="100%" stopColor="#d9c7a3" />
          </linearGradient>
        </defs>
        <rect x="24" y="60" width="24" height="46" rx="4" fill="url(#ev-wax)" />
        <ellipse cx="36" cy="60" rx="12" ry="4" fill="#efe1c4" />
        <rect x="34.5" y="49" width="1.6" height="13" rx="0.8" fill="#4a3826" />
        <g style={{ transformOrigin: "36px 44px", animation: gusting ? "emovra-flame-gust 0.9s ease-out 1" : "emovra-flame 2.4s ease-in-out infinite" }}>
          <path d="M36 20 C46 32 44 44 36 48 C28 44 26 32 36 20 Z" fill="url(#ev-flame-core)" />
        </g>
        {sparks.map((sp) => (
          <circle
            key={sp.id}
            cx={36 + sp.dx}
            cy="24"
            r="1.6"
            fill="#ffd58a"
            style={{ animation: `emovra-spark-rise ${sp.duration}s ease-out forwards`, animationDelay: `${sp.delay}s` }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes emovra-flame {
          0%, 100% { transform: scale(1, 1) rotate(0deg); opacity: 1; }
          25% { transform: scale(0.94, 1.06) rotate(-2deg); opacity: 0.92; }
          50% { transform: scale(1.06, 0.95) rotate(1.5deg); opacity: 1; }
          75% { transform: scale(0.97, 1.03) rotate(-1deg); opacity: 0.95; }
        }
        @keyframes emovra-flame-gust {
          0% { transform: scale(1,1) rotate(0deg); }
          30% { transform: scale(0.65,1.35) rotate(-16deg); }
          60% { transform: scale(1.2,0.8) rotate(12deg); }
          100% { transform: scale(1,1) rotate(0deg); }
        }
        @keyframes emovra-spark-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-46px); opacity: 0; } }
      `}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>{t("musicTherapy.candleCaption")}</p>
    </div>
  );
}

// FIX: same issue as the candle - three tiny 🐟🐠🐡 emoji floating in a
// flat gradient box looked cheap. Replaced with small SVG fish (simple
// body + tail shapes, a highlight for depth) plus rising bubbles, and
// tapping the water now bursts a little cluster of bubbles from wherever
// you tapped, instead of just being a static scene.
function VirtualAquarium() {
  // FIX: this component called t("musicTherapy.aquariumCaption") below
  // without ever destructuring `t` from useLanguage() - a guaranteed
  // ReferenceError crash the moment this visual rendered.
  const { t } = useLanguage();
  const FISH_COLORS = ["#e8a35a", "#6ec6d9", "#e88a6a"];
  const [taps, setTaps] = useState([]);

  function handleTap(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    const burst = Array.from({ length: 5 }, (_, i) => ({
      id: id + i,
      x: Math.min(96, Math.max(4, x + (Math.random() - 0.5) * 10)),
      y,
      delay: i * 0.06,
    }));
    setTaps((t) => [...t, ...burst]);
    setTimeout(() => setTaps((t) => t.filter((b) => !burst.some((n) => n.id === b.id))), 1600);
  }

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        style={{ position: "relative", height: 140, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "linear-gradient(180deg, rgba(96,165,250,0.18), rgba(45,110,160,0.08))" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={`bubble-${i}`}
            style={{
              position: "absolute",
              bottom: -10,
              left: `${15 + i * 22}%`,
              width: 5 + (i % 2) * 3,
              height: 5 + (i % 2) * 3,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              animation: `emovra-bubble ${5 + i}s linear infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
        {FISH_COLORS.map((color, i) => (
          <svg
            key={i}
            width="34"
            height="18"
            viewBox="0 0 34 18"
            style={{ position: "absolute", top: `${18 + i * 26}%`, animation: `emovra-swim${i} ${9 + i * 3}s linear infinite` }}
          >
            <path d="M10 9 L1 3 L1 15 Z" fill={color} opacity="0.85" />
            <ellipse cx="20" cy="9" rx="10" ry="5.5" fill={color} />
            <ellipse cx="17" cy="6" rx="3" ry="1.4" fill="rgba(255,255,255,0.3)" />
            <circle cx="25" cy="7.5" r="1.3" fill="#0a0a0c" />
          </svg>
        ))}
        {taps.map((b) => (
          <span
            key={b.id}
            style={{
              position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: 6, height: 6, marginLeft: -3, marginTop: -3,
              borderRadius: "50%", background: "rgba(255,255,255,0.6)",
              animation: "emovra-bubble-burst 1.4s ease-out forwards", animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes emovra-bubble { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(-150px); opacity: 0; } }
        @keyframes emovra-bubble-burst { 0% { transform: translateY(0) scale(1); opacity: 0.9; } 100% { transform: translateY(-70px) scale(1.4); opacity: 0; } }
        @keyframes emovra-swim0 { 0%{left:-8%; transform:scaleX(1);} 49%{transform:scaleX(1);} 50%{left:100%; transform:scaleX(-1);} 99%{transform:scaleX(-1);} 100%{left:-8%; transform:scaleX(1);} }
        @keyframes emovra-swim1 { 0%{left:100%; transform:scaleX(-1);} 49%{transform:scaleX(-1);} 50%{left:-8%; transform:scaleX(1);} 99%{transform:scaleX(1);} 100%{left:100%; transform:scaleX(-1);} }
        @keyframes emovra-swim2 { 0%{left:-8%; transform:scaleX(1);} 49%{transform:scaleX(1);} 50%{left:100%; transform:scaleX(-1);} 99%{transform:scaleX(-1);} 100%{left:-8%; transform:scaleX(1);} }
      `}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>{t("musicTherapy.aquariumCaption")}</p>
    </div>
  );
}

// NEW: three more calming visuals alongside the candle/aquarium - rain on
// a window and a fireplace pair with ambient sounds already offered
// above, and a starry sky gives a third, wind-down-flavored option. All
// three are tappable too, same as the candle/aquarium above.
function VirtualRainWindow() {
  const { t } = useLanguage();
  const DROPS = Array.from({ length: 14 }, (_, i) => i);
  const [wipes, setWipes] = useState([]);

  function handleTap(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setWipes((w) => [...w, { id, x, y }]);
    setTimeout(() => setWipes((w) => w.filter((wp) => wp.id !== id)), 3000);
  }

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        style={{
          position: "relative", height: 140, borderRadius: 12, overflow: "hidden", cursor: "pointer",
          background: "linear-gradient(180deg, rgba(70,90,120,0.35), rgba(30,38,52,0.55))",
          border: "1px solid rgba(180,200,230,0.15)",
        }}
      >
        {DROPS.map((i) => {
          const left = (i * 7.2 + (i % 3) * 2) % 100;
          const duration = 1.4 + (i % 5) * 0.35;
          const delay = (i % 7) * 0.4;
          const height = 14 + (i % 4) * 6;
          return (
            <span
              key={i}
              style={{
                position: "absolute", top: -20, left: `${left}%`, width: 2, height,
                borderRadius: 2, background: "linear-gradient(180deg, rgba(200,220,255,0) 0%, rgba(200,220,255,0.55) 100%)",
                animation: `emovra-rain-fall ${duration}s linear infinite`, animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        {wipes.map((w) => (
          <span
            key={w.id}
            style={{
              position: "absolute", left: `${w.x}%`, top: `${w.y}%`, width: 54, height: 54, marginLeft: -27, marginTop: -27,
              borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 70%)",
              animation: "emovra-wipe-fade 3s ease-out forwards",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(212,197,160,0.15)" }} />
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(212,197,160,0.15)" }} />
      </div>
      <style>{`
        @keyframes emovra-rain-fall { 0% { transform: translateY(0); opacity: 0.9; } 100% { transform: translateY(170px); opacity: 0.2; } }
        @keyframes emovra-wipe-fade { 0% { opacity: 0; transform: scale(0.5); } 15% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.15); } }
      `}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>{t("musicTherapy.rainCaption")}</p>
    </div>
  );
}

function VirtualFireplace() {
  const { t } = useLanguage();
  const [poking, setPoking] = useState(false);
  const [sparks, setSparks] = useState([]);

  function handleTap() {
    setPoking(true);
    setTimeout(() => setPoking(false), 700);
    const id = Date.now();
    const burst = Array.from({ length: 6 }, (_, i) => ({
      id: id + i,
      x: 44 + Math.random() * 32,
      delay: Math.random() * 0.3,
      duration: 1 + Math.random() * 0.7,
    }));
    setSparks((s) => [...s, ...burst]);
    setTimeout(() => setSparks((s) => s.filter((sp) => !burst.some((b) => b.id === sp.id))), 2200);
  }

  return (
    <div style={{ textAlign: "center", padding: "10px 0", cursor: "pointer" }} onClick={handleTap} role="button" tabIndex={0}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="ev-fire-core" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff2c9" />
            <stop offset="40%" stopColor="#ffb648" />
            <stop offset="80%" stopColor="#e2531f" />
            <stop offset="100%" stopColor="#e2531f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ev-ember-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffcf7a" />
            <stop offset="100%" stopColor="#ffcf7a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="28" y="92" width="64" height="10" rx="5" fill="#4a3325" />
        <rect x="34" y="84" width="52" height="9" rx="4.5" fill="#5c4130" />
        <circle cx="45" cy="90" r="9" fill="url(#ev-ember-glow)" style={{ animation: "emovra-ember-flicker 1.6s ease-in-out infinite" }} />
        <circle cx="70" cy="88" r="7" fill="url(#ev-ember-glow)" style={{ animation: "emovra-ember-flicker 2s ease-in-out infinite 0.4s" }} />
        <g style={{ transformOrigin: "60px 70px", animation: poking ? "emovra-fire-poke 0.7s ease-out 1" : "emovra-fire-flicker 1.8s ease-in-out infinite" }}>
          <path d="M60 30 C74 46 72 64 60 72 C48 64 46 46 60 30 Z" fill="url(#ev-fire-core)" />
        </g>
        <g style={{ transformOrigin: "44px 78px", animation: "emovra-fire-flicker 2.1s ease-in-out infinite 0.3s" }}>
          <path d="M44 52 C53 62 52 74 44 79 C36 74 35 62 44 52 Z" fill="url(#ev-fire-core)" opacity="0.85" />
        </g>
        <g style={{ transformOrigin: "76px 78px", animation: "emovra-fire-flicker 1.7s ease-in-out infinite 0.6s" }}>
          <path d="M76 54 C84 63 83 74 76 79 C69 74 68 63 76 54 Z" fill="url(#ev-fire-core)" opacity="0.85" />
        </g>
        {sparks.map((sp) => (
          <circle
            key={sp.id}
            cx={sp.x}
            cy="80"
            r="1.4"
            fill="#ffcf7a"
            style={{ animation: `emovra-spark-rise ${sp.duration}s ease-out forwards`, animationDelay: `${sp.delay}s` }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes emovra-fire-flicker {
          0%, 100% { transform: scale(1,1) rotate(0deg); opacity: 1; }
          30% { transform: scale(0.92,1.08) rotate(-3deg); opacity: 0.9; }
          60% { transform: scale(1.08,0.94) rotate(2deg); opacity: 1; }
        }
        @keyframes emovra-fire-poke {
          0% { transform: scale(1,1) rotate(0deg); }
          25% { transform: scale(0.8,1.3) rotate(-8deg); }
          55% { transform: scale(1.25,0.85) rotate(6deg); }
          100% { transform: scale(1,1) rotate(0deg); }
        }
        @keyframes emovra-ember-flicker { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes emovra-spark-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }
      `}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{t("musicTherapy.fireplaceCaption")}</p>
    </div>
  );
}

function VirtualStarryNight() {
  const { t } = useLanguage();
  const STARS = Array.from({ length: 22 }, (_, i) => i);
  const [wishes, setWishes] = useState([]);

  function handleTap() {
    const id = Date.now();
    setWishes((w) => [...w, { id }]);
    setTimeout(() => setWishes((w) => w.filter((x) => x.id !== id)), 1300);
  }

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        style={{
          position: "relative", height: 140, borderRadius: 12, overflow: "hidden", cursor: "pointer",
          background: "linear-gradient(180deg, #171733 0%, #262450 60%, #33305f 100%)",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: "absolute", top: 14, right: 18, filter: "drop-shadow(0 0 10px rgba(255,244,214,0.45))" }}>
          <circle cx="17" cy="17" r="13" fill="#fdf4d6" />
          <circle cx="23" cy="13" r="12" fill="#262450" />
        </svg>
        {STARS.map((i) => {
          const left = (i * 13 + (i % 5) * 7) % 100;
          const top = (i * 17 + (i % 4) * 11) % 80;
          const size = 1 + (i % 3);
          const duration = 2 + (i % 4) * 0.6;
          const delay = (i % 6) * 0.5;
          return (
            <span
              key={i}
              style={{
                position: "absolute", left: `${left}%`, top: `${top}%`, width: size, height: size,
                borderRadius: "50%", background: "#fdf4d6",
                animation: `emovra-star-twinkle ${duration}s ease-in-out infinite`, animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        {wishes.map((w) => (
          <span
            key={w.id}
            style={{
              position: "absolute", top: "14%", left: "6%", width: 46, height: 2, borderRadius: 2,
              background: "linear-gradient(90deg, rgba(253,244,214,0), rgba(253,244,214,0.95))",
              animation: "emovra-shooting-star 1.1s ease-in forwards",
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes emovra-star-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        @keyframes emovra-shooting-star {
          0% { transform: translate(0, 0) rotate(28deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate(230px, 150px) rotate(28deg); opacity: 0; }
        }
      `}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>{t("musicTherapy.starsCaption")}</p>
    </div>
  );
}

export default function MusicTherapy() {
  const [moods, setMoods] = useState(null);
  const [visual, setVisual] = useState(null);
  const ambient = useAmbientSound();
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`${API}/profile/options`).then((r) => r.json()).then((d) => { if (d.success) setMoods(d.musicMoods); }).catch(() => {});
  }, []);

  const SOUNDS = [
    { k: "rain", emoji: "🌧", labelKey: "musicTherapy.soundRain" },
    { k: "fireplace", emoji: "🔥", labelKey: "musicTherapy.soundFireplace" },
    { k: "forest", emoji: "🌲", labelKey: "musicTherapy.soundForest" },
    { k: "cafe", emoji: "☕", labelKey: "musicTherapy.soundCafe" },
    { k: "white-noise", emoji: "📻", labelKey: "musicTherapy.soundWhiteNoise" },
    { k: "calm-tone", emoji: "🎵", labelKey: "musicTherapy.soundCalmDrone" },
  ];

  const VISUALS = [
    { k: "candle", emoji: "🕯️", labelKey: "musicTherapy.candleButton", Comp: VirtualCandle },
    { k: "aquarium", emoji: "🐠", labelKey: "musicTherapy.aquariumButton", Comp: VirtualAquarium },
    { k: "rain-window", emoji: "🌧", labelKey: "musicTherapy.rainWindowButton", Comp: VirtualRainWindow },
    { k: "fireplace-visual", emoji: "🔥", labelKey: "musicTherapy.fireplaceVisualButton", Comp: VirtualFireplace },
    { k: "stars", emoji: "✨", labelKey: "musicTherapy.starsButton", Comp: VirtualStarryNight },
  ];

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🎧 {t("musicTherapy.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{t("musicTherapy.subtitle")}</p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("musicTherapy.ambientSoundsHeading")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SOUNDS.map((s) => (
            <button
              key={s.k}
              onClick={() => (ambient.playing && ambient.kind === s.k ? ambient.stop() : ambient.start(s.k))}
              style={{
                padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13,
                border: ambient.playing && ambient.kind === s.k ? "2px solid #d4b07a" : "1px solid var(--border)",
                background: ambient.playing && ambient.kind === s.k ? "rgba(212,176,122,0.15)" : "transparent",
                color: "var(--text)",
              }}
            >
              {ambient.playing && ambient.kind === s.k ? "⏸ " : "▶ "}{s.emoji} {t(s.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("musicTherapy.calmingVisualsHeading")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {VISUALS.map((v) => (
            <button
              key={v.k}
              onClick={() => setVisual(visual === v.k ? null : v.k)}
              style={{
                padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13,
                border: visual === v.k ? "2px solid #d4b07a" : "1px solid var(--border)",
                background: visual === v.k ? "rgba(212,176,122,0.15)" : "transparent",
                color: "var(--text)",
              }}
            >
              {v.emoji} {t(v.labelKey)}
            </button>
          ))}
        </div>
        {VISUALS.map((v) => visual === v.k && <v.Comp key={v.k} />)}
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("musicTherapy.findMusicHeading")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(moods || []).map((m) => {
            const moodKind = `mood:${m.mood}`;
            const isPlayingThis = ambient.playing && ambient.kind === moodKind;
            return (
              <div key={m.mood} style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => (isPlayingThis ? ambient.stop() : ambient.startMoodTone(m.mood))}
                  title={t("musicTherapy.playInApp")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12,
                    border: "none", cursor: "pointer",
                    background: isPlayingThis ? "rgba(212,176,122,0.15)" : "transparent",
                    color: "var(--text)",
                  }}
                >
                  {isPlayingThis ? "⏸" : "▶"} {m.emoji} {m.label}
                </button>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(m.query)}`}
                  target="_blank" rel="noreferrer"
                  title={t("musicTherapy.searchFullSong")}
                  style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderLeft: "1px solid var(--border)", color: "var(--text)", opacity: 0.7, textDecoration: "none", fontSize: 12 }}
                >
                  🔗
                </a>
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(m.query)}`}
                  target="_blank" rel="noreferrer"
                  title={t("musicTherapy.searchSpotify", { query: m.query })}
                  style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderLeft: "1px solid var(--border)", color: "#1DB954", textDecoration: "none", fontSize: 13 }}
                >
                  ♫
                </a>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>{t("musicTherapy.searchDisclaimer")}</p>
      </div>
    </div>
  );
}
