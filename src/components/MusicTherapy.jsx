import { useState, useRef, useEffect } from "react";

const API = "https://emovra.onrender.com/api";

// NEW: fully original ambient soundscape generator using the Web Audio API
// - no licensed/copyrighted audio files involved anywhere. Layered
// oscillators + filtered noise, similar in spirit to a white-noise machine.
function useAmbientSound() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState("rain");

  function stop() {
    nodesRef.current.forEach((n) => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    nodesRef.current = [];
    setPlaying(false);
  }

  function start(soundKind) {
    stop();
    const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);

    if (soundKind === "rain" || soundKind === "white-noise") {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = soundKind === "rain" ? "highpass" : "lowpass";
      filter.frequency.value = soundKind === "rain" ? 800 : 2000;
      noise.connect(filter).connect(master);
      noise.start();
      nodesRef.current = [noise, filter, master];
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

export default function MusicTherapy() {
  const [moods, setMoods] = useState(null);
  const ambient = useAmbientSound();

  useEffect(() => {
    fetch(`${API}/profile/options`).then((r) => r.json()).then((d) => { if (d.success) setMoods(d.musicMoods); }).catch(() => {});
  }, []);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🎧 Music Therapy</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Ambient sounds you can play right here, or find music that fits your mood.</p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ambient sounds</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ k: "rain", label: "🌧 Rain" }, { k: "white-noise", label: "📻 White Noise" }, { k: "calm-tone", label: "🎵 Calm Drone" }].map((s) => (
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
