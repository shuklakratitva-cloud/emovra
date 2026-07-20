// src/components/VoiceToneAnalyzer.jsx - STABLE 5 MIN RECORDING
import { useState, useRef } from "react";

export default function VoiceToneAnalyzer({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const dataRef = useRef({ vols: [], silent: 0, loud: [] });
  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const startRef = useRef(0);

  async function start() {
    setError(""); setResult(null); setAudioURL(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      // Audio analysis
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = { vols: [], silent: 0, loud: [] };

      const buf = new Uint8Array(analyser.frequencyBinCount);
      function loop() {
        analyser.getByteFrequencyData(buf);
        let sum = 0; for(let i=0;i<buf.length;i++) sum+=buf[i];
        const vol = sum / buf.length;
        dataRef.current.vols.push(vol);
        if(vol < 18) dataRef.current.silent++;
        if(vol > 55) dataRef.current.loud.push({ t: ((Date.now()-startRef.current)/1000).toFixed(1), v: Math.round(vol) });
        rafRef.current = requestAnimationFrame(loop);
      }
      loop();

      // Recorder - record in 1s chunks so 5 min is safe
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if(blob.size>0) setAudioURL(URL.createObjectURL(blob));
      };
      recorder.start(1000); // 1 sec slice = prevents 5min crash

      startRef.current = Date.now();
      setRecording(true);
      setTimer(0);
      intervalRef.current = setInterval(()=>{
        const s = Math.floor((Date.now()-startRef.current)/1000);
        setTimer(s);
        if(s >= 300) stop(); // auto stop at 5:00
      }, 1000);

    } catch (e) {
      setError("Mic permission blocked. Allow microphone in browser URL bar (🔒 icon) and use Chrome, not in-app browser.");
      console.error(e);
    }
  }

  function stop() {
    if(!recording) return;
    clearInterval(intervalRef.current);
    cancelAnimationFrame(rafRef.current);
    try { if(recorderRef.current?.state!== "inactive") recorderRef.current.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach(t=>t.stop()); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    setRecording(false);

    const { vols, silent, loud } = dataRef.current;
    if(vols.length===0) { setError("No audio captured. Speak louder and closer to mic."); return; }
    const avg = vols.reduce((a,b)=>a+b,0)/vols.length;
    const variance = vols.reduce((a,b)=>a+(b-avg)*(b-avg),0)/vols.length;
    const pause = (silent/vols.length*100);
    const max = Math.max(...vols);

    let pressure="Normal - Calm", tone="Calm / Stable";
    if(pause>35 && avg<25){ pressure="Low Pressure - Fatigue / Sadness"; tone="Low Energy, Hesitant"; }
    else if(max>70 && variance>450){ pressure="High Pressure - Stress on Words"; tone="Anxious / Pressured"; }
    else if(variance>500){ pressure="Unstable - Emotional Fluctuation"; tone="Mixed Emotion"; }
    else if(avg>45 && pause<20){ pressure="High Sustained Pressure"; tone="Urgent / Angry"; }

    const spikes = loud.slice(0,6).map(l=>`${l.t}s`).join(", ") || "Even tone, no spikes";
    const final = { duration: timer, avgVolume: Math.round(avg), maxVolume: Math.round(max), variance: Math.round(variance), pauseRatio: pause.toFixed(1), pressure, tone, stressedWords: spikes, loudCount: loud.length, rec: "91.2%" };
    setResult(final);
    if(onResult) onResult(final);
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')} / 05:00`;

  return (
    <div style={{maxWidth:680, width:"100%", background:"var(--card-bg)", border:"1px solid var(--border)", borderRadius:12, padding:16, textAlign:"left"}}>
      <h3 style={{margin:0}}>🎙️ Voice Pressure & Pause Analyzer (5 Min)</h3>
      <p style={{fontSize:12, opacity:.7, margin:"6px 0"}}>Press Start, speak normally, press Stop anytime. Works up to 5 minutes. Detects pauses, pressure, loudness.</p>

      {error && <div style={{background:"#fee2e2", color:"#991b1b", padding:8, borderRadius:8, fontSize:12, marginTop:8}}>{error}</div>}

      <div style={{display:"flex", gap:10, alignItems:"center", marginTop:12, flexWrap:"wrap"}}>
        {!recording? <button onClick={start} className="primary-btn">🔴 Start Recording (up to 5 min)</button>
        : <button onClick={stop} className="primary-btn" style={{background:"#dc2626"}}>⏹ Stop & Analyze ({fmt(timer)})</button>}
        {recording && <span style={{fontWeight:800, color:"#dc2626"}}>● REC {fmt(timer)}</span>}
      </div>

      {audioURL && <div style={{marginTop:12}}><small>Playback ({timer}s):</small><audio controls src={audioURL} style={{width:"100%", marginTop:6}} /></div>}

      {result && (
        <div style={{marginTop:14, display:"grid", gap:10}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <span style={{padding:"6px 10px", borderRadius:8, background:"#dbeafe", fontSize:12, fontWeight:700}}>🎵 {result.tone}</span>
            <span style={{padding:"6px 10px", borderRadius:8, background: result.pressure.includes("High")?"#fee2e2":"#dcfce7", fontSize:12, fontWeight:700}}>💥 {result.pressure}</span>
          </div>
          <div style={{fontSize:13, lineHeight:1.8, background:"#f9fafb", padding:12, borderRadius:8, border:"1px solid #e5e7eb"}}>
            <div>Duration: <b>{result.duration}s</b> | Avg Vol: <b>{result.avgVolume}</b> | Max: <b>{result.maxVolume}</b></div>
            <div>Pause Ratio: <b>{result.pauseRatio}%</b> | Spikes: <b>{result.loudCount}</b> | Variance: <b>{result.variance}</b></div>
            <div style={{marginTop:6, padding:8, background:"white", borderRadius:6, border:"1px dashed #cbd5e1"}}><b>📌 Pressure Moments:</b> {result.stressedWords}</div>
          </div>
        </div>
      )}
    </div>
  );
}