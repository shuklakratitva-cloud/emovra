import { useState, useEffect } from 'react'
import ThemeToggle from "./components/ThemeToggle";
import RiskCard from "./components/RiskCard";
import MoodTracker from "./components/MoodTracker";
import  MoodChart  from "./components/MoodChart.jsx";
import Journal from "./components/Journal";
import GroundingExercises from "./components/GroundingExercises";
import TeleManas from "./components/TeleManas";
import { calculateRisk } from "./utils/risk";
import { saveAnalysis, loadAnalysis } from "./utils/storage";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import './App.css'

function getAdvice(level, emotion, sentiment){
  if(level==="GREEN"){
    if(emotion==="happy"||sentiment==="positive") return "Great to hear you're positive! Keep gratitude journaling, share your joy with a friend, and keep doing what lifts you up.";
    return "You're in a stable range. Maintain healthy habits: sleep, water, movement, and staying connected.";
  }
  if(level==="YELLOW"){
    if(emotion==="anxious"||emotion==="overwhelmed") return "Try Box Breathing 4-4-4-4 for 2 minutes, or do the 5-4-3-2-1 grounding exercise below.";
    if(emotion==="sad"||emotion==="lonely") return "Consider reaching out to one person today, even with a short message. A 10-minute walk outside can help shift mood.";
    return "Take a pause. Hydrate, stretch, and write down 3 things that are within your control right now.";
  }
  if(level==="ORANGE") return "It sounds like you're carrying a lot. Please talk to a trusted friend, family member, or counselor. Try a grounding exercise and avoid isolating yourself.";
  return "You matter and help is available. Please call Tele-MANAS 14416 or 1800-891-4416 right now. If you can, stay with someone you trust. You don't have to face this alone.";
}

function App() {
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(() => { try { return loadAnalysis() || null } catch { return null } });
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  useEffect(()=>{ if(transcript) setInputText(transcript) },[transcript]);

  function handleAnalyze(){
    if(!inputText.trim()) return;
    const result = calculateRisk(inputText);
    setAnalysis(result);
    try{ saveAnalysis(result); }catch{}
    setInputText("");
  }
  function handleKeyDown(e){
    if(e.key==='Enter' &&!e.shiftKey){
      e.preventDefault();
      handleAnalyze();
    }
  }
  function handleChange(e){ setInputText(e.target.value); }
  const advice = analysis? getAdvice(analysis.riskLevel, analysis.emotion, analysis.sentiment) : "";

  return (
    <>
      <ThemeToggle />
      <section id="center">
        <div><h1>MindGuard - Mental Health Check</h1><p><b>Enter</b> to Analyze • <b>Shift+Enter</b> for new line</p></div>
        <div style={{width:"100%",maxWidth:680,marginTop:16}}>
          <textarea rows={5} value={inputText} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Type here... Press Enter to send, Shift+Enter for new line. Try 'I am happy today'" style={{width:"100%",padding:14,borderRadius:12,border:"1px solid var(--border)",resize:"vertical"}}/>
          <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={handleAnalyze} className="primary-btn">Analyze (Enter)</button>
            <button onClick={()=>listening?stopListening():startListening("en-IN")} className="secondary-btn">{listening?"Stop Listening":"🎙 Speak"}</button>
            <button onClick={()=>{setInputText("");setAnalysis(null);try{localStorage.removeItem('mental_health_last_analysis')}catch{}}} className="secondary-btn">Clear</button>
          </div>
          <div style={{fontSize:12,opacity:.6,marginTop:8}}>You DON'T need to clear manually — box clears automatically after Enter.</div>
        </div>

        {analysis && (
          <>
            <RiskChart analysis={analysis} />
            {/* THIS IS THE LINE — ADDED HERE */}
            <MoodChart history={analysis? [analysis] : []} />

            <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginTop:16,textAlign:"left"}}>
              <strong>💡 Personalized Advice:</strong>
              <p style={{marginTop:8,lineHeight:1.6}}>{advice}</p>
              <small style={{opacity:.6}}>Signals: {(analysis.reasons||[analysis.emotion, analysis.sentiment]).join(", ")} | Score: {analysis.score} | Level: {analysis.riskLevel}</small>
            </div>
          </>
        )}
      </section>
      <div className="ticks"></div>
      <section style={{maxWidth:800,margin:"0 auto",width:"100%",padding:"0 16px"}}><MoodTracker/><Journal/><GroundingExercises/><TeleManas/></section>
      <div className="ticks"></div><section id="spacer"></section>
    </>
  )
}
export default App