import { useState, useRef, useEffect } from "react";

const API = "https://emovra.onrender.com/api";

// Original ambient soundscape generator using the Web Audio API - no
// licensed/copyrighted audio files anywhere. Layered oscillators +
// filtered noise, similar in spirit to a white-noise machine.
//
// NEW: added fireplace, forest, and café - same synthesis approach as the
// original rain/white-noise/drone, just different filter bands and, for
// fireplace/forest, randomly-timed short bursts layered on top (crackle,
// chirps). These are stylized abstractions of the real sounds, not actual
// recordings - genuinely original audio, same as everything else here.
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

  function makeNoiseBuffer(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // A single short burst of filtered noise - used for fireplace crackle
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

  // A single short chirp tone - used for forest birds
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
      else if (soundKind === "forest") { filter.type = "bandpass"; filter.frequency.value = 500; filter.Q.value = 0.6; }
      else { filter.type = "bandpass"; filter.frequency.value = 350; filter.Q.value = 0.4; } // cafe - low murmur band
      noise.connect(filter).connect(master);
      noise.start();
      nodesRef.current = [noise, filter, master];

      if (soundKind === "forest") {
        const id = setInterval(() => { if (Math.random() > 0.5) chirp(ctx, master); }, 1400);
        intervalsRef.current = [id];
      }
    } else if (soundKind === "fireplace") {
      // low rumble bed + random crackle bursts on top
      const osc = ctx.createOscillator();
      osc.type = "sine"; osc.frequency.value = 90;
      const g = ctx.createGain(); g.gain.value = 0.3;
      osc.connect(g).connect(master);
      osc.start();
      nodesRef.current = [osc, g, master];
      const id = setInterval(() => burst(ctx, master, 2000 + Math.random() * 2000, 0.05 + Math.random() * 0.05), 220);
      intervalsRef.current = [id];
    } else {
      // "calm-tone" - two slowly detuned sine waves, a gentle drone
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

  return { playing, kind, start, stop };
}

// Virtual candle - simple CSS flicker animation, no canvas/assets needed
function VirtualCandle() {
  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontSize: 48, animation: "emovra-flicker 1.8s ease-in-out infinite" }}>🕯️</div>
      <style>{`@keyframes emovra-flicker { 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:0.85; transform:scale(0.97) rotate(-1deg);} 75%{opacity:0.95; transform:scale(1.02) rotate(1deg);} }`}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Just something to watch for a moment.</p>
    </div>
  );
}

// Virtual aquarium - a few CSS-animated fish drifting across
function VirtualAquarium() {
  const FISH = ["🐟", "🐠", "🐡"];
  return (
    <div style={{ position: "relative", height: 120, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg, rgba(96,165,250,0.15), rgba(96,165,250,0.05))", marginTop: 10 }}>
      {FISH.map((f, i) => (
        <div key={i} style={{
          position: "absolute", top: `${20 + i * 30}%`, fontSize: 22,
          animation: `emovra-swim${i} ${8 + i * 3}s linear infinite`,
        }}>{f}</div>
      ))}
      <style>{`
        @keyframes emovra-swim0 { 0%{left:-10%; transform:scaleX(1);} 49%{transform:scaleX(1);} 50%{left:105%; transform:scaleX(-1);} 99%{transform:scaleX(-1);} 100%{left:-10%; transform:scaleX(1);} }
        @keyframes emovra-swim1 { 0%{left:105%; transform:scaleX(-1);} 49%{transform:scaleX(-1);} 50%{left:-10%; transform:scaleX(1);} 99%{transform:scaleX(1);} 100%{left:105%; transform:scaleX(-1);} }
        @keyframes emovra-swim2 { 0%{left:-10%; transform:scaleX(1);} 49%{transform:scaleX(1);} 50%{left:105%; transform:scaleX(-1);} 99%{transform:scaleX(-1);} 100%{left:-10%; transform:scaleX(1);} }
      `}</style>
    </div>
  );
}

export default function MusicTherapy() {
  const [moods, setMoods] = useState(null);
  const [visual, setVisual] = useState(null); // null | "candle" | "aquarium"
  const ambient = useAmbientSound();

  useEffect(() => {
    fetch(`${API}/profile/options`).then((r) => r.json()).then((d) => { if (d.success) setMoods(d.musicMoods); }).catch(() => {});
  }, []);

  const SOUNDS = [
    { k: "rain", label: "🌧 Rain" },
    { k: "fireplace", label: "🔥 Fireplace" },
    { k: "forest", label: "🌲 Forest" },
    { k: "cafe", label: "☕ Café" },
    { k: "white-noise", label: "📻 White Noise" },
    { k: "calm-tone", label: "🎵 Calm Drone" },
  ];

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🎧 Relaxing Room</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Ambience, calming visuals, or find music that fits your mood.</p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ambient sounds</div>
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
              {ambient.playing && ambient.kind === s.k ? "⏸ " : "▶ "}{s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Calming visuals</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setVisual(visual === "candle" ? null : "candle")} style={{ padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, border: visual === "candle" ? "2px solid #d4b07a" : "1px solid var(--border)", background: visual === "candle" ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>🕯️ Candle</button>
          <button onClick={() => setVisual(visual === "aquarium" ? null : "aquarium")} style={{ padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, border: visual === "aquarium" ? "2px solid #d4b07a" : "1px solid var(--border)", background: visual === "aquarium" ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>🐠 Aquarium</button>
        </div>
        {visual === "candle" && <VirtualCandle />}
        {visual === "aquarium" && <VirtualAquarium />}
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Find music for your mood</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(moods || []).map((m) => (
            <a
              key={m.mood}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(m.query)}`}
              target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontSize: 12 }}
            >
              {m.emoji} {m.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>Opens a search on YouTube in a new tab - not affiliated, just a starting point.</p>
      </div>
    </div>
  );
}
