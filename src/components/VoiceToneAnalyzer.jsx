import { useState, useRef } from "react";

export default function VoiceToneAnalyzer({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  const recRef = useRef(null); const streamRef = useRef(null);
  const chunksRef = useRef([]); const volsRef = useRef([]);
  const silentRef = useRef(0); const intRef = useRef(null);
  const rafRef = useRef(null); const startRef = useRef(0);

  async function start(){
    setResult(null); setAudioURL(null); volsRef.current=[]; silentRef.current=0;
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    streamRef.current=stream;
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize=2048; src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const loop = ()=>{ an.getByteFrequencyData(data); let s=0; for(let v of data) s+=v; const vol=s/data.length; volsRef.current.push(vol); if(vol<18) silentRef.current++; rafRef.current=requestAnimationFrame(loop); }; loop();
    const rec = new MediaRecorder(stream); recRef.current=rec; chunksRef.current=[];
    rec.ondataavailable=e=>{if(e.data.size>0) chunksRef.current.push(e.data)};
    rec.onstop=()=>{ const b=new Blob(chunksRef.current,{type:'audio/webm'}); if(b.size>0) setAudioURL(URL.createObjectURL(b)) };
    rec.start(500); startRef.current=Date.now(); setRecording(true);
    intRef.current=setInterval(()=>{ const el=Math.floor((Date.now()-startRef.current)/1000); setTimer(el); if(el>=300) stop(); },1000);
  }

  function stop(){
    clearInterval(intRef.current); cancelAnimationFrame(rafRef.current);
    try{recRef.current?.stop()}catch{}; try{streamRef.current?.getTracks().forEach(t=>t.stop())}catch{};
    setRecording(false);

    let vols = volsRef.current.length? volsRef.current : [22,23,22];
    const avg = vols.reduce((a,b)=>a+b,0)/vols.length;
    const variance = vols.reduce((a,b)=>a+(b-avg)*(b-avg),0)/vols.length;
    const pauseRatio = Math.min(99,(silentRef.current/vols.length*100));

    let score=0, level="GREEN", emotion="calm", reasons=[], advice="";

    // SAME AS TEXT "i want to die" = RED
    if (pauseRatio > 42 || (avg < 20 && variance < 150)) {
      score=92; level="RED"; emotion="sad / hopeless / possible crisis";
      reasons=["Long pauses "+pauseRatio.toFixed(0)+"%","Very low energy / flat voice","Possible withdrawal - like 'i want to disappear'"];
      advice="Crisis pattern detected in voice. You matter. Please talk to someone now. Call Tele-MANAS 14416 or 1800-599-0019. If you can, stay with someone you trust.";
    } else if (pauseRatio > 28 || variance > 550) {
      score=65; level="ORANGE"; emotion="anxious / distressed";
      reasons=["Moderate pauses "+pauseRatio.toFixed(0)+"%","Voice pressure spikes","Stress detected"];
      advice="Stress detected. Try 4-7-8 breathing, grounding, walk, hydrate. If persists, talk to counselor.";
    } else if (pauseRatio > 18 || variance > 320) {
      score=30; level="YELLOW"; emotion="tense";
      reasons=["Slight hesitation","Mild tension"];
      advice="Slight tension in voice. Pause, stretch, short break.";
    } else {
      score=8; level="GREEN"; emotion="calm / stable";
      reasons=["Stable tone","Even pace"];
      advice="Voice calm and stable. Keep healthy sleep and routine.";
    }

    const out = {
      duration: timer, riskLevel: level, level, score, emotion,
      sentiment: score>35?"negative":score<15?"positive":"neutral",
      reasons: reasons.slice(0,5), advice,
      pauseRatio: pauseRatio.toFixed(1), avgVolume: Math.round(avg), variance: Math.round(variance),
      isCrisis: level==="RED", // SAME FLAG AS TEXT
      helpline: level==="RED" ? "Tele-MANAS: 14416 | Kiran: 1800-599-0019" : null
    };
    setResult(out); if(onResult) onResult(out);
  }

  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')} / 05:00`;
  const color = result?.level==="RED"?"#dc2626":result?.level==="ORANGE"?"#ea580c":result?.level==="YELLOW"?"#ca8a04":"#16a34a";

  return(
    <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,textAlign:"left"}}>
      <h3 style={{margin:0}}>🎙️ Voice Risk Check - Same as Text</h3>
      <p style={{fontSize:12,opacity:.7,margin:"6px 0"}}>Speak slowly with pauses = RED like "i want to die". Calm voice = GREEN.</p>
      <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
        {!recording? <button onClick={start} className="primary-btn">🔴 Start (5 min)</button>
        : <button onClick={stop} className="primary-btn" style={{background:"#dc2626"}}>⏹ Stop & Analyze ({fmt(timer)})</button>}
        {recording && <span style={{fontWeight:800,color:"#dc2626"}}>● REC {fmt(timer)}</span>}
      </div>
      {audioURL && <audio controls src={audioURL} style={{width:"100%",marginTop:10}} />}

      {result && (
        <div style={{marginTop:14,border:`2px solid ${color}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{background:color,color:"white",padding:"10px 14px",fontWeight:800,display:"flex",justifyContent:"space-between"}}>
            <span>VOICE Risk: {result.level}</span><span>Score: {result.score}</span>
          </div>
          <div style={{padding:12,background:"#f9fafb",fontSize:13,lineHeight:1.7}}>
            <div><b>Tone:</b> {result.emotion} | <b>Pause:</b> {result.pauseRatio}% | <b>Vol Avg:</b> {result.avgVolume}</div>
            <div><b>Reasons:</b> {result.reasons.join(" • ")}</div>
            <div style={{marginTop:8,padding:10,background:"white",borderRadius:8,border:"1px solid #e5e7eb"}}>
              <b>Advice:</b> {result.advice}
              {result.isCrisis && <div style={{marginTop:8,padding:8,background:"#fee2e2",borderRadius:6,color:"#991b1b",fontWeight:700}}>🚨 {result.helpline} - Same as text "i want to die" - Fewer suggestions, safety first.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}