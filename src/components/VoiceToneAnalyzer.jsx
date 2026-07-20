import { useState, useRef } from "react";
import { analyzeRisk } from "../utils/analyzeRisk.js";

export default function VoiceToneAnalyzer({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const dataRef = useRef({ vols: [], silent: 0 });
  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const startRef = useRef(0);
  const recogRef = useRef(null);

  async function start() {
    setError(""); setResult(null); setAudioURL(null); setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1. Tone analysis
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
      dataRef.current = { vols: [], silent: 0 };
      const buf = new Uint8Array(analyser.frequencyBinCount);
      function loop() {
        analyser.getByteFrequencyData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i];
        const vol = sum / buf.length;
        dataRef.current.vols.push(vol);
        if (vol < 18) dataRef.current.silent++;
        rafRef.current = requestAnimationFrame(loop);
      }
      loop();

      // 2. WORD RECOGNITION - Web Speech API
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        recogRef.current = rec;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        let finalText = "";
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t + " ";
            else interim += t;
          }
          setTranscript((finalText + interim).trim());
        };
        rec.onerror = () => {};
        rec.start();
      } else {
        setTranscript("(Speech recognition not supported in this browser - use Chrome)");
      }

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder; chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: "audio/webm" }); if (blob.size > 0) setAudioURL(URL.createObjectURL(blob)); };
      recorder.start(1000);

      startRef.current = Date.now(); setRecording(true); setTimer(0);
      intervalRef.current = setInterval(() => { const s = Math.floor((Date.now() - startRef.current) / 1000); setTimer(s); if (s >= 300) stop(); }, 1000);
    } catch (e) {
      setError("Mic blocked. Allow mic in address bar lock icon and use Chrome.");
    }
  }

  function stop() {
    if (!recording) return;
    clearInterval(intervalRef.current); cancelAnimationFrame(rafRef.current);
    try { recogRef.current?.stop(); } catch {}
    try { if (recorderRef.current?.state!== "inactive") recorderRef.current.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    setRecording(false);

    const { vols, silent } = dataRef.current;
    const text = transcript || "";
    // Analyze WORDS using same logic as text input
    const wordAnalysis = analyzeRisk(text);

    let avg = 20, pause = 0, variance = 100;
    if (vols.length) {
      avg = vols.reduce((a, b) => a + b, 0) / vols.length;
      variance = vols.reduce((a, b) => a + (b - avg) * (b - avg), 0) / vols.length;
      pause = (silent / vols.length * 100);
    }

    let level = wordAnalysis? wordAnalysis.level : "GREEN";
    let score = wordAnalysis? wordAnalysis.score : 0;
    let reasons = wordAnalysis? [...wordAnalysis.reasons] : [];
    let emotion = wordAnalysis? wordAnalysis.emotion : "calm";

    // Tone boosts score - if words are risky AND tone is sad = higher RED
    if (pause > 40 || (avg < 20 && variance < 200)) {
      score += 25; reasons.push("Low energy voice + long pauses " + pause.toFixed(0) + "%");
      if (score >= 70) level = "RED"; else if (score >= 35 && level === "GREEN") level = "ORANGE";
      emotion = emotion === "calm"? "sad / low energy" : emotion;
    }
    if (variance > 500) {
      score += 15; reasons.push("Voice unstable / stressed");
      if (level === "GREEN") level = "YELLOW";
    }

    if (score >= 75) level = "RED"; else if (score >= 40) level = "ORANGE"; else if (score >= 15) level = "YELLOW"; else level = "GREEN";
    const isCrisis = level === "RED";

    const out = {
      transcript: text || "(no words detected - speak louder closer to mic)",
      duration: timer,
      riskLevel: level, level, score: Math.min(score, 100),
      emotion, sentiment: score > 35? "negative" : score < 15? "positive" : "neutral",
      reasons: [...new Set(reasons)].slice(0, 8),
      pauseRatio: pause.toFixed(1), avgVolume: Math.round(avg),
      isCrisis, helpline: isCrisis? "Tele-MANAS: 14416 | Kiran: 1800-599-0019" : null,
      advice: isCrisis? "Crisis pattern in words + voice. Please call 14416 now. Stay with someone." : wordAnalysis?.advice || "Stable.",
      wordScore: wordAnalysis?.score || 0, toneScore: Math.round(pause)
    };
    setResult(out); if (onResult) onResult(out);
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')} / 05:00`;
  const color = result?.level === "RED"? "#dc2626" : result?.level === "ORANGE"? "#ea580c" : result?.level === "YELLOW"? "#ca8a04" : "#16a34a";

  return (
    <div style={{ maxWidth: 700, width: "100%", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, textAlign: "left" }}>
      <h3 style={{ margin: 0 }}>Voice Word + Tone Check - Same as Text</h3>
      <p style={{ fontSize: 12, opacity: 0.7, margin: "6px 0" }}>Now recognizes words like no one will know if i die + checks tone. Use Chrome.</p>
      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 8, borderRadius: 8, fontSize: 12, marginTop: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        {!recording? <button onClick={start} className="primary-btn">Start - Speak Now</button> : <button onClick={stop} className="primary-btn" style={{ background: "#dc2626" }}>Stop and Analyze ({fmt(timer)})</button>}
        {recording && <span style={{ fontWeight: 800, color: "#dc2626" }}>REC {fmt(timer)} - Listening: {transcript.slice(-40)}</span>}
      </div>
      {transcript && <div style={{ marginTop: 10, padding: 8, background: "#f3f4f6", borderRadius: 6, fontSize: 13 }}><b>Heard:</b> {transcript}</div>}
      {audioURL && <audio controls src={audioURL} style={{ width: "100%", marginTop: 10 }} />}
      {result && (
        <div style={{ marginTop: 14, border: `2px solid ${color}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: color, color: "white", padding: "10px 14px", fontWeight: 800, display: "flex", justifyContent: "space-between" }}><span>VOICE Risk: {result.level}</span><span>Score: {result.score}</span></div>
          <div style={{ padding: 12, background: "#f9fafb", fontSize: 13, lineHeight: 1.7 }}>
            <div><b>Words:</b> {result.transcript}</div>
            <div><b>Emotion:</b> {result.emotion} | <b>Pause:</b> {result.pauseRatio}% | <b>Word Score:</b> {result.wordScore}</div>
            <div><b>Reasons:</b> {result.reasons.join(" | ")}</div>
            <div style={{ marginTop: 8, padding: 10, background: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <b>Advice:</b> {result.advice}
              {result.isCrisis && <div style={{ marginTop: 8, padding: 8, background: "#fee2e2", borderRadius: 6, color: "#991b1b", fontWeight: 700 }}> {result.helpline} - Same as text i want to die - Safety first, fewer suggestions.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}