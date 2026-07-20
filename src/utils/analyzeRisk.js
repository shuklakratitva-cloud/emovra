// src/components/VoiceToneAnalyzer.jsx - VOICE -> RED/YELLOW/GREEN like text
import { useState, useRef } from "react";

export default function VoiceToneAnalyzer({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  const recRef = useRef(null); const streamRef = useRef(null);
  const chunksRef = useRef([]); const volsRef = useRef([]);
  const silentRef = useRef(0); const loudRef = useRef([]);
  const rafRef = useRef(null); const intRef = useRef(null);
  const startRef = useRef(0); const ctxRef = useRef(null);

  async function start(){
    setResult(null); setAudioURL(null); volsRef.current=[]; silentRef.current=0; loudRef.current=[];
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    streamRef.current=stream;
    const ctx = new (window.AudioContext||window.webkitAudioContext)(); ctxRef.current=ctx;
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize=2048; src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const loop = ()=>{ an.getByteFrequencyData(data); let s=0; for(let v of data) s+=v; const vol=s/data.length; volsRef.current.push(vol); if(vol<18) silentRef.current++; if(vol>55) loudRef.current.push(Date.now()); rafRef.current=requestAnimationFrame(loop); }; loop();
    const rec = new MediaRecorder(stream); recRef.current=rec; chunksRef.current=[];
    rec.ondataavailable=e=>{if(e.data.size>0) chunksRef.current.push(e.data)};
    rec.onstop=()=>{ const b=new Blob(chunksRef.current,{type:'audio/webm'}); if(b.size>0) setAudioURL(URL.createObjectURL(b)) };
    rec.start(500); startRef.current=Date.now(); setRecording(true); setTimer(0);
    intRef.current=setInterval(()=>{ const el=Math.floor((Date.now()-startRef.current)/1000); setTimer(el); if(el>=300) stop(); },1000);
  }

  function stop(){
    clearInterval(intRef.current); cancelAnimationFrame(rafRef.current);
    try{recRef.current?.stop()}catch{}; try{streamRef.current?.getTracks().forEach(t=>t.stop())}catch{}; try{ctxRef.current?.close()}catch{};
    setRecording(false);

    let vols = volsRef.current.length? volsRef.current : [22,24,23];
    const avg = vols.reduce((a,b)=>a+b,0)/vols.length;
    const max = Math.max(...vols);
    const variance = vols.reduce((a,b)=>a+(b-avg)*(b-avg),0)/vols.length;
    const pauseRatio = Math.min(99,(silentRef.current/vols.length*100));
    const loudCount = loudRef.current.length;

    // === VOICE -> RISK LOGIC (same as text) ===
    let score = 0; let level="GREEN"; let emotion="calm"; let reasons=[];
    // Low energy / many pauses = sadness / hopeless = HIGH RISK
    if(pauseRatio > 40){ score+=85; level="RED"; emotion="sad / hopeless"; reasons.push(`Long pauses ${pauseRatio.toFixed(0)}% - hesitation, fatigue`); }
    else if(pauseRatio > 25){ score+=35; if(level==="GREEN") level="ORANGE"; emotion="anxious"; reasons.push(`Moderate pauses ${pauseRatio.toFixed(0)}%`); }

    // Unstable variance = emotional fluctuation = ORANGE/RED
    if(variance > 600){ score+=70; level="RED"; emotion="unstable / distressed"; reasons.push(`High emotional fluctuation (variance ${Math.round(variance)})`); }
    else if(variance > 350){ score+=30; if(level==="GREEN") level="ORANGE"; reasons.push(`Voice pressure spikes`); }

    // Very loud + fast = anger / agitation = ORANGE
    if(avg > 48 && pauseRatio < 15){ score+=40; if(level==="GREEN") level="ORANGE"; emotion="angry / urgent"; reasons.push(`High sustained loudness avg ${Math.round(avg)}`); }

    // Very low volume + flat = withdrawal = ORANGE/RED
    if(avg < 18 && max < 35){ score+=60; if(level!=="RED") level="ORANGE"; emotion="withdrawn / low energy"; reasons.push(`Very low volume - flat affect`); }

    // Loud spikes = stress on words
    if(loudCount > 12){ score+=30; reasons.push(`${loudCount} pressure spikes on words`); if(level==="GREEN") level="YELLOW"; }

    if(score>=80) level="RED"; else if(score>=40) level="ORANGE"; else if(score>=15) level="YELLOW"; else level="GREEN";
    if(level==="GREEN"){ emotion="calm / stable"; reasons.push("Stable tone, even pace"); }

    const out = {
      duration: timer,
      riskLevel: level, level, // both for compatibility
      score, emotion, sentiment: score>30?"negative":score<15?"positive":"neutral",
      reasons: reasons.slice(0,5),
      // voice specifics
      avgVolume: Math.round(avg), maxVolume: Math.round(max), variance: Math.round(variance),
      pauseRatio: pauseRatio.toFixed(1), loudCount,
      pressure: level==="RED" ? "High Emotional Pressure" : level==="ORANGE" ? "Moderate Pressure" : "Low / Calm",
      tone: emotion,
      advice: level==="RED" ? "Voice shows high distress/pauses. Please talk to someone you trust now. Call 14416. Try grounding exercise." :
              level==="ORANGE" ? "Stress detected in voice. Take 4-7-8 breathing break, walk, hydrate." :
              level==="YELLOW" ? "Slight tension in voice. Pause, stretch." : "Voice calm and stable. Keep healthy habits."
    };
    setResult(out); if(onResult) onResult(out);
  }

  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')} / 05:00`;
  const color = result?.riskLevel==="RED"?"#dc2626":result?.riskLevel==="ORANGE"?"#ea580c":result?.riskLevel==="YELLOW"?"#ca8a04":"#16a34a";

  return(
    <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,textAlign:"left"}}>
      <h3 style={{margin:0}}>🎙️ Voice Check - RED / GREEN Analysis (5 Min)</h3>
      <p style={{fontSize:12,opacity:.7,margin:"6px 0"}}>Now voice gives same Risk Level as text. Speak → Stop → Get GREEN/YELLOW/ORANGE/RED.</p>
      <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
        {!recording? <button onClick={start} className="primary-btn">🔴 Start Voice Check</button>
        : <button onClick={stop} className="primary-btn" style={{background:"#dc2626"}}>⏹ Stop & Analyze ({fmt(timer)})</button>}
        {recording && <span style={{fontWeight:800,color:"#dc2626"}}>● REC {fmt(timer)}</span>}
      </div>
      {audioURL && <audio controls src={audioURL} style={{width:"100%",marginTop:10}} />}

      {result && (
        <div style={{marginTop:14,border:`2px solid ${color}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{background:color,color:"white",padding:"10px 14px",fontWeight:800,display:"flex",justifyContent:"space-between"}}>
            <span>Risk: {result.riskLevel}</span><span>Score: {result.score}</span>
          </div>
          <div style={{padding:12,background:"#f9fafb",fontSize:13,lineHeight:1.7}}>
            <div><b>🎵 Tone:</b> {result.emotion} | <b>Pause:</b> {result.pauseRatio}% | <b>Spikes:</b> {result.loudCount}</div>
            <div><b>Vol:</b> Avg {result.avgVolume} Max {result.maxVolume} Var {result.variance}</div>
            <div style={{marginTop:6}}><b>Reasons:</b> {result.reasons.join(" • ")}</div>
            <div style={{marginTop:8,padding:8,background:"white",borderRadius:8,border:"1px solid #e5e7eb"}}><b>💡 Advice:</b> {result.advice}</div>
            <div style={{marginTop:8,fontSize:11,opacity:.6}}>Duration: {result.duration}s | Same logic as text analysis, but from speech patterns.</div>
          </div>
        </div>
      )}
    </div>
  );
}