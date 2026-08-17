import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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

  // A single short percussive "clink" - used for café cup/spoon sounds,
  // deliberately a noise burst (not a tone like the forest chirp) so the
  // two ambiences are audibly distinct, not just differently-filtered noise
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
      else if (soundKind === "forest") { filter.type = "bandpass"; filter.frequency.value = 900; filter.Q.value = 0.5; } // higher, airier - wind through leaves
      else { filter.type = "bandpass"; filter.frequency.value = 220; filter.Q.value = 1.1; } // cafe - much lower, muffled murmur band, distinct from forest
      noise.connect(filter);

      if (soundKind === "cafe") {
        // slow amplitude wobble (LFO) so the murmur ebbs and flows like
        // background conversation, instead of a flat noise bed - this,
        // combined with the much lower filter band and clink sounds
        // instead of chirps, is what makes café audibly different from
        // forest now, not just a different filter frequency
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
  const { t } = useLanguage();
  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontSize: 48, animation: "emovra-flicker 1.8s ease-in-out infinite" }}>🕯️</div>
      <style>{`@keyframes emovra-flicker { 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:0.85; transform:scale(0.97) rotate(-1deg);} 75%{opacity:0.95; transform:scale(1.02) rotate(1deg);} }`}</style>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>{t("musicTherapy.candleCaption")}</p>
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setVisual(visual === "candle" ? null : "candle")} style={{ padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, border: visual === "candle" ? "2px solid #d4b07a" : "1px solid var(--border)", background: visual === "candle" ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>🕯️ {t("musicTherapy.candleButton")}</button>
          <button onClick={() => setVisual(visual === "aquarium" ? null : "aquarium")} style={{ padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, border: visual === "aquarium" ? "2px solid #d4b07a" : "1px solid var(--border)", background: visual === "aquarium" ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>🐠 {t("musicTherapy.aquariumButton")}</button>
        </div>
        {visual === "candle" && <VirtualCandle />}
        {visual === "aquarium" && <VirtualAquarium />}
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("musicTherapy.findMusicHeading")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(moods || []).map((m) => (
            <div key={m.mood} style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(m.query)}`}
                target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", color: "var(--text)", textDecoration: "none", fontSize: 12 }}
              >
                {m.emoji} {m.label}
              </a>
              {/* NEW: Spotify search link - no account linking/OAuth (Spotify
                  caps new developer apps at 5 total users as of 2026 unless
                  you qualify for extended quota, which needs 250k+ MAU to
                  even apply - not viable here. This is just a search URL,
                  works for anyone, no limits, no Premium requirement). */}
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(m.query)}`}
                target="_blank" rel="noreferrer"
                title={t("musicTherapy.searchSpotify", { query: m.query })}
                style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderLeft: "1px solid var(--border)", color: "#1DB954", textDecoration: "none", fontSize: 13 }}
              >
                ♫
              </a>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>{t("musicTherapy.searchDisclaimer")}</p>
      </div>
    </div>
  );
}
