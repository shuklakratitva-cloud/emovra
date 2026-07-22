// src/App.jsx - FINAL FIXED: All features + Gemini + Violence + Abuse + Dark Mode
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useState, useEffect } from 'react'
import ThemeToggle from "./components/ThemeToggle";
import RiskCard from "./components/RiskCard";
import MoodTracker from "./components/MoodTracker";
import MoodChart from "./components/MoodChart.jsx";
import Journal from "./components/Journal";
import GroundingExercises from "./components/GroundingExercises";
import TeleManas from "./components/TeleManas";
import { getCounselingAdvice, getTopEmotions } from "./utils/counselor.js";
import VoiceToneAnalyzer from "./components/VoiceToneAnalyzer.jsx";
import { saveAnalysis, loadAnalysis } from "./utils/storage";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import { analyzeWithGemini } from "./utils/geminiAnalyzer.js";
import { analyzeRisk } from "./utils/analyzeRisk.js";
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
  const [analysis, setAnalysis] = useState(null);
  useEffect(()=>{
    try{
      const old = loadAnalysis();
      if(old && old.text && old.text.trim() && (old.score??0)!== 0) setAnalysis(old);
    }catch{}
  },[]);
  const [voiceData, setVoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
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

  async function handleAnalyze(){
    if(!inputText.trim()) return;
    setLoading(true);
    const lower = inputText.toLowerCase();
    const violenceKeys = ["kill","murder","stab","shoot","hurt him","hurt her","kill him","kill her","want to kill","gonna kill","i will kill","choke","beat him","slit"];
    const abuseKeys = ["fuck","motherfucker","bitch","bastard","asshole","madarchod","behenchod","chutiya","gandu","randi","saala","bsdk","lavde"];

    // 1. CLIENT HARD FORCE - must be before Gemini
    if (violenceKeys.some(k=>lower.includes(k))) {
      const forced = {
        riskLevel:"RED", level:"RED", score:98, emotion:"angry", sentiment:"negative",
        reasons:[`violence / homicidal intent detected: ${inputText.slice(0,40)}`],
        advice:"Intense anger detected. Stop. Breathe. Do not act. Step away and talk to someone now.",
        isCrisis:true, helpline:"Tele-MANAS 14416 | If you may act, call 112",
        source:"force-RED-violence", text: inputText, timestamp: new Date().toISOString(), id: Date.now()
      };
      const counselingList = getCounselingAdvice(inputText, forced.emotion, forced.riskLevel);
      const topEmotions = getTopEmotions(inputText);
      const withTime = {...forced, counseling: counselingList, counselingList, topEmotions, voiceTone: voiceData};
      setAnalysis(withTime); setHistory(h=>[...h, withTime].slice(-20));
      try{ saveAnalysis(withTime); }catch{} setInputText(""); setLoading(false); return;
    }

    if (abuseKeys.some(k=>lower.includes(k))) {
      const count = abuseKeys.filter(k=>lower.includes(k)).length;
      const score = count >=2? 55 : 35;
      const forced = {
        riskLevel: score>=45?"ORANGE":"YELLOW", level: score>=45?"ORANGE":"YELLOW", score,
        emotion:"angry", sentiment:"negative",
        reasons:[`abusive language detected`], advice:"Abuse shows high stress. Pause and rephrase.",
        isCrisis:false, source:`force-abuse-${score}`, text: inputText, timestamp: new Date().toISOString(), id: Date.now()
      };
      const counselingList = getCounselingAdvice(inputText, forced.emotion, forced.riskLevel);
      const topEmotions = getTopEmotions(inputText);
      const withTime = {...forced, counseling: counselingList, counselingList, topEmotions, voiceTone: voiceData};
      setAnalysis(withTime); setHistory(h=>[...h, withTime].slice(-20));
      try{ saveAnalysis(withTime); }catch{} setInputText(""); setLoading(false); return;
    }

    let result;
    try {
      const geminiResult = await analyzeWithGemini(inputText, voiceData);
      result = {
        riskLevel: geminiResult.level || geminiResult.riskLevel || "GREEN",
        level: geminiResult.level || "GREEN",
        score: geminiResult.score || 0,
        emotion: geminiResult.emotion || "neutral",
        sentiment: geminiResult.sentiment || "neutral",
        reasons: geminiResult.reasons || [],
        advice: geminiResult.advice || "",
        isCrisis: geminiResult.isCrisis || false,
        helpline: geminiResult.helpline || "",
        source: geminiResult.source || "gemini"
      };
    } catch (e) {
      const fallback = analyzeRisk(inputText);
      result = {...fallback, source: "fallback-keyword"};
    }

    const counselingList = getCounselingAdvice(inputText, result.emotion, result.riskLevel);
    const topEmotions = getTopEmotions(inputText);
    const withTime = {...result, counseling: counselingList, counselingList, topEmotions, voiceTone: voiceData, timestamp: new Date().toISOString(), id: Date.now(), text: inputText };
    setAnalysis(withTime);
    setHistory(h=>[...h, withTime].slice(-20));
    try{ saveAnalysis(withTime); }catch{}
    setInputText("");
    setLoading(false);
  }

  function handleKeyDown(e){
    if(e.key==='Enter' &&!e.shiftKey){ e.preventDefault(); handleAnalyze(); }
  }

  const advice = analysis? getAdvice(analysis.riskLevel, analysis.emotion, analysis.sentiment) : "";
  const counselingArray = Array.isArray(analysis?.counseling)? analysis.counseling : (analysis?.counseling? [analysis.counseling] : []);

  return (
    <ErrorBoundary>
      <>
        <ThemeToggle />
        <section id="center">
          <div><h1>MindGuard - Mental Health Check</h1><p><b>Enter</b> to Analyze • <b>Shift+Enter</b> for new line</p></div>
          <div style={{width:"100%",maxWidth:680,marginTop:16}}>
            <textarea rows={5} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a long para... e.g. I am stressed about exams, anxious and overthinking, tired, sad and lonely" style={{width:"100%",padding:14,borderRadius:12,border:"1px solid var(--border)",resize:"vertical", background:"var(--card-bg)", color:"var(--text)"}}/>
            <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={handleAnalyze} disabled={loading} className="primary-btn" style={{opacity: loading?0.6:1}}>{loading? "Analyzing with Gemini..." : "Analyze (Enter)"}</button>
              <button onClick={()=>listening?stopListening():startListening("en-IN")} className="secondary-btn">{listening?"Stop Listening":"🎙 Speak"}</button>
              <button onClick={()=>{setInputText("");setAnalysis(null);setHistory([]);setVoiceData(null);try{localStorage.clear()}catch{}}} className="secondary-btn">Clear All</button>
            </div>
            <div style={{fontSize:12,opacity:.6,marginTop:8, color:"var(--muted)"}}>Now powered by Gemini AI. Detects self-harm + violence + abuse + Voice Tone.</div>
          </div>

          {analysis && (
            <>
              <RiskCard analysis={analysis} text={analysis.text} />
              {analysis.topEmotions && analysis.topEmotions.length > 1 && (
                <div style={{maxWidth:680, width:"100%", display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginTop:12}}>
                  {analysis.topEmotions.map(t=>(
                    <span key={t.emotion} style={{padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid var(--border)", background:"var(--card-bg)", color:"var(--text)"}}>
                      {t.emotion.toUpperCase()} {t.percent}%
                    </span>
                  ))}
                </div>
              )}
              <MoodChart history={history.length? history : [analysis]} />
              {analysis.voiceTone && (
                <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:12,marginTop:10, fontSize:13, textAlign:"left", color:"var(--text)"}}>
                  <b>🔊 Last Voice Reading:</b> {analysis.voiceTone.tone} | Pressure: {analysis.voiceTone.pressure}
                </div>
              )}
              <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginTop:16,textAlign:"left", color:"var(--text)"}}>
                <strong>💡 Personalized Advice:</strong>
                <p style={{marginTop:8,lineHeight:1.6}}>{advice}</p>
                <small style={{color:"var(--muted)"}}>Triggers: {(analysis.reasons||[]).join(", ")} | Score: {String(analysis.score)} | Level: {String(analysis.riskLevel)} | Source: {String(analysis.source||"")}</small>
              </div>
              {counselingArray.length > 0 && (
                <div style={{maxWidth:680,width:"100%",marginTop:16, display:"grid", gap:12}}>
                  <h3 style={{margin:"4px 0", textAlign:"left", color:"var(--text)"}}>🧠 Recommended Solutions ({counselingArray.length})</h3>
                  {counselingArray.map((c,i)=>(
                    <div key={c.id || i} style={{background:i===0?"#f0fdf4":"var(--card-bg)",border:`1px solid ${i===0?"#bbf7d0":"var(--border)"}`,borderRadius:12,padding:18,textAlign:"left"}}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}><h4 style={{margin:0, color:"#166534"}}>{i+1}. {c.technique}</h4><small style={{background:"#e0f2fe", padding:"3px 8px", borderRadius:12, textTransform:"capitalize", color:"#0c4a6e"}}>{c.emotion}</small></div>
                      <p style={{lineHeight:1.6, fontSize:14, margin:"8px 0", color:"var(--text)"}}>{c.advice}</p>
                      <ol style={{margin:"10px 0", paddingLeft:20, fontSize:14, color:"var(--text)"}}>{c.steps?.map(s => <li key={s} style={{marginBottom:4}}>{s}</li>)}</ol>
                      <small style={{color:"var(--muted)"}}>Matched: {(c.matchedKeywords||c.keywords||[]).slice(0,3).join(", ")} | Source: {c.source}</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section style={{maxWidth:680, margin:"20px auto", width:"100%", padding:"0 16px"}}>
          <VoiceToneAnalyzer onResult={(toneData)=>{ setVoiceData(toneData); setAnalysis(prev => prev? {...prev, voiceTone: toneData} : prev); }} />
        </section>

        <div className="ticks"></div>
        <section style={{maxWidth:800,margin:"0 auto",width:"100%",padding:"0 16px"}}><MoodTracker/><Journal/><GroundingExercises/><TeleManas/></section>
        <div className="ticks"></div><section id="spacer"></section>
      </>
    </ErrorBoundary>
  )
}
export default App