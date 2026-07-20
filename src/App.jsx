// src/App.jsx
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useState, useEffect } from 'react'
import ThemeToggle from "./components/ThemeToggle";
import RiskCard from "./components/RiskCard";
import MoodTracker from "./components/MoodTracker";
import MoodChart from "./components/MoodChart.jsx";
import Journal from "./components/Journal";
import GroundingExercises from "./components/GroundingExercises";
import TeleManas from "./components/TeleManas";
import { analyzeRisk } from "./utils/analyzeRisk.js";
import { getCounselingAdvice } from "./utils/counselor.js"; // <-- NEW
import { saveAnalysis, loadAnalysis } from "./utils/storage";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import './App.css'

function getAdvice(level, emotion, sentiment){
  const emo = String(emotion || "").toLowerCase();
  const lvl = String(level || "").toUpperCase();
  if(lvl==="GREEN"){
    if(emo==="happy"||sentiment==="positive") return "Great to hear you're positive! Keep gratitude journaling, share your joy with a friend, and keep doing what lifts you up.";
    return "You're in a stable range. Maintain healthy habits: sleep, water, movement, and staying connected.";
  }
  if(lvl==="YELLOW"){
    if(emo==="anxious"||emo==="overwhelmed") return "Slight stress detected. Try Box Breathing 4-4-4-4 for 2 minutes, or do the 5-4-3-2-1 grounding exercise below.";
    if(emo==="sad"||emo==="lonely") return "Consider reaching out to one person today, even with a short message. A 10-minute walk outside can help.";
    return "Take a pause. Hydrate, stretch, and write down 3 things that are within your control right now.";
  }
  if(lvl==="ORANGE") return "It sounds like you're carrying a lot. Please talk to a trusted friend, family member, or counselor. Try a grounding exercise and avoid isolating yourself.";
  return "You matter and help is available. Please call Tele-MANAS 14416 right now. If you can, stay with someone you trust.";
}

function App() {
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(() => { try { return loadAnalysis() || null } catch { return null } });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('emovra_history');
      if(!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map(h=>({
    ...h,
        riskLevel: typeof h.riskLevel==='string'? h.riskLevel : (h.riskLevel?.level||h.riskLevel?.label||"GREEN"),
        emotion: typeof h.emotion==='string'? h.emotion : (h.emotion?.label||h.emotion?.dominant||"neutral"),
        sentiment: typeof h.sentiment==='string'? h.sentiment : (h.sentiment?.label||"neutral"),
        score: h.score?? 0,
      }));
    } catch { return [] }
  });

  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  useEffect(()=>{ if(transcript) setInputText(transcript) },[transcript]);
  useEffect(()=>{ try{ localStorage.setItem('emovra_history', JSON.stringify(history)); }catch{} },[history]);

  function handleAnalyze(){
    if(!inputText.trim()) return;
    const result = analyzeRisk(inputText);
    if(!result) return;

    // NEW: Get counseling technique from public knowledge base
    const counseling = getCounselingAdvice(inputText, result.emotion, result.riskLevel);

    const withTime = {...result, counseling, timestamp: new Date().toISOString(), id: Date.now(), text: inputText };
    setAnalysis(withTime);
    const newHistory = [...history, withTime].slice(-20);
    setHistory(newHistory);
    try{ saveAnalysis(withTime); }catch{}
    setInputText("");
  }

  function handleKeyDown(e){
    if(e.key==='Enter' &&!e.shiftKey){ e.preventDefault(); handleAnalyze(); }
  }

  const advice = analysis? getAdvice(analysis.riskLevel, analysis.emotion, analysis.sentiment) : "";

  return (
    <ErrorBoundary>
      <>
        <ThemeToggle />
        <section id="center">
          <div><h1>MindGuard - Mental Health Check</h1><p><b>Enter</b> to Analyze • <b>Shift+Enter</b> for new line</p></div>
          <div style={{width:"100%",maxWidth:680,marginTop:16}}>
            <textarea rows={5} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type here... Try 'i am stressed and overthinking'" style={{width:"100%",padding:14,borderRadius:12,border:"1px solid var(--border)",resize:"vertical"}}/>
            <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={handleAnalyze} className="primary-btn">Analyze (Enter)</button>
              <button onClick={()=>listening?stopListening():startListening("en-IN")} className="secondary-btn">{listening?"Stop Listening":"🎙 Speak"}</button>
              <button onClick={()=>{setInputText("");setAnalysis(null);setHistory([]);try{localStorage.clear()}catch{}}} className="secondary-btn">Clear All</button>
            </div>
            <div style={{fontSize:12,opacity:.6,marginTop:8}}>Detects slight stress + gives counseling technique from public KB.</div>
          </div>

          {analysis && (
            <>
              <RiskCard analysis={analysis} text={analysis.text} />
              <MoodChart history={history.length? history : [analysis]} />

              <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginTop:16,textAlign:"left"}}>
                <strong>💡 Personalized Advice:</strong>
                <p style={{marginTop:8,lineHeight:1.6}}>{advice}</p>
                <small style={{opacity:.6}}>Triggers: {(analysis.reasons||[]).join(", ")} | Score: {String(analysis.score)} | Level: {String(analysis.riskLevel)}</small>
              </div>

              {/* NEW: Counseling KB Solution Card */}
              {analysis.counseling && (
                <div style={{maxWidth:680,width:"100%",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:18,marginTop:16,textAlign:"left"}}>
                  <h3 style={{margin:"0 0 8px 0", color:"#166534"}}>🧠 Recommended: {analysis.counseling.technique}</h3>
                  <p style={{lineHeight:1.6, fontSize:14, margin:"0 0 10px 0"}}>{analysis.counseling.advice}</p>
                  <ol style={{margin:"10px 0", paddingLeft:20, fontSize:14}}>
                    {analysis.counseling.steps.map(s => <li key={s} style={{marginBottom:4}}>{s}</li>)}
                  </ol>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, flexWrap:"wrap", gap:8}}>
                    <small style={{color:"#666"}}>Source: {analysis.counseling.source} • Educational only</small>
                    <a href="https://findahelpline.org/countries/in" target="_blank" rel="noreferrer" style={{fontSize:12, color:"#16a34a", textDecoration:"underline"}}>Find Helpline</a>
                  </div>
                  {analysis.counseling.disclaimer && <p style={{color:"#dc2626", fontWeight:600, fontSize:12, marginTop:8}}>{analysis.counseling.disclaimer}</p>}
                </div>
              )}
            </>
          )}
        </section>
        <div className="ticks"></div>
        <section style={{maxWidth:800,margin:"0 auto",width:"100%",padding:"0 16px"}}><MoodTracker/><Journal/><GroundingExercises/><TeleManas/></section>
        <div className="ticks"></div><section id="spacer"></section>
      </>
    </ErrorBoundary>
  )
}
export default App