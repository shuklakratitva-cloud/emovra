import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import ThemeToggle from "../components/ThemeToggle";
import RiskCard from "../components/RiskCard";
import MoodTracker from "../components/MoodTracker";
import MoodChart from "../components/MoodChart";
import Journal from "../components/Journal";
import GroundingExercises from "../components/GroundingExercises";
import TeleManas from "../components/TeleManas";
import { getCounselingAdvice, getTopEmotions } from "../utils/counselor.js";
import VoiceToneAnalyzer from "../components/VoiceToneAnalyzer.jsx";
import { saveAnalysis, loadAnalysis } from "../utils/storage";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { analyzeWithGemini } from "../utils/geminiAnalyzer.js";
import { analyzeRisk } from "../utils/analyzeRisk.js";
import Auth from "../components/Auth.jsx";
import '../App.css'

const API = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

function getAdvice(level){
  const lvl = String(level||"").toUpperCase();
  if(lvl==="GREEN") return "You're in a stable range. Maintain healthy habits.";
  if(lvl==="YELLOW") return "Slight stress detected. Try Box Breathing 4-4-4-4.";
  if(lvl==="ORANGE") return "Please talk to a trusted friend or counselor.";
  return "You matter. Call Tele-MANAS 14416 right now.";
}

export default function MindGuardApp() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [user, setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem('user'))}catch{return null} });
  const [voiceData, setVoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(()=>{
    try{ const s=localStorage.getItem('emovra_history'); return s?JSON.parse(s):[]; }catch{ return [] }
  });

  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();

  useEffect(()=>{ if(transcript) setInputText(transcript) },[transcript]);

  useEffect(()=>{
    try{
      const old=loadAnalysis();
      if(old&&old.text) setAnalysis(old);
      const token=localStorage.getItem('token');
      if(token){
        fetch(`${API}/data/my`,{headers:{Authorization:`Bearer ${token}`}})
       .then(r=>{if(!r.ok)throw new Error();return r.json()})
       .then(d=>{if(Array.isArray(d)&&d.length)setHistory(d.reverse().slice(-20))})
       .catch(()=>{})
      }
    }catch{}
  },[]);

  useEffect(()=>{ try{localStorage.setItem('emovra_history',JSON.stringify(history))}catch{} },[history]);

  async function saveToBackend(entry){
    const t=localStorage.getItem('token'); if(!t) return;
    try{ await fetch(`${API}/data/save`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify(entry)}) }catch(e){console.log(e.message)}
  }

  async function handleAnalyze(){
    if(!inputText.trim()) return;
    setLoading(true);
    const lower=inputText.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
    const redKeys=["i want to die","kill myself","end my life","suicide","no one will know if i die","want to kill","murder","slit","choke","mujhe marna hai","marna hai mujhe","mar jana hai","mar jau","jeena nahi hai","khatam karna hai","khud ko khatam","khudkushi","zindagi khatam","marna chahta hu","nahi jeena","zindagi se tang","life se tang","pareshan hu marna"];

    if(redKeys.some(k=>lower.includes(k))){
      const forced={ riskLevel:"RED", score:98, emotion:"critical", sentiment:"negative", reasons:[`critical/self-harm detected: ${inputText.slice(0,80)}`], advice:"You matter. Please reach out now.", isCrisis:true, text:inputText, timestamp:new Date().toISOString(), id:Date.now(), counseling:getCounselingAdvice(inputText,"critical","RED"), topEmotions:getTopEmotions(inputText), voiceTone:voiceData };
      const t=localStorage.getItem('token');
      if(t){ fetch(`${API}/alerts/red`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({text:inputText,score:98,reasons:forced.reasons,riskLevel:"RED"})}).then(r=>r.json()).then(d=>console.log("RED saved",d)).catch(()=>{}) }
      setAnalysis(forced); setHistory(h=>[...h,forced].slice(-20)); try{saveAnalysis(forced)}catch{} saveToBackend(forced); setInputText(""); setLoading(false); return;
    }

    let result;
    try{ const g=await analyzeWithGemini(inputText,voiceData); result={riskLevel:g.level||"GREEN",score:g.score||0,emotion:g.emotion||"neutral",sentiment:g.sentiment||"neutral",reasons:g.reasons||[],advice:g.advice||"",source:"gemini"} }
    catch{ const f=analyzeRisk(inputText); result={...f,source:"fallback"} }

    const withTime={...result,counseling:getCounselingAdvice(inputText,result.emotion,result.riskLevel),topEmotions:getTopEmotions(inputText),voiceTone:voiceData,timestamp:new Date().toISOString(),id:Date.now(),text:inputText};
    setAnalysis(withTime); setHistory(h=>[...h,withTime].slice(-20)); try{saveAnalysis(withTime)}catch{} saveToBackend(withTime); setInputText(""); setLoading(false);
  }

  if(!user){
    return <Auth onAuth={setUser} onLogin={setUser} />;
  }

  const advice=getAdvice(analysis?.riskLevel);
  const counselingArray=Array.isArray(analysis?.counseling)?analysis.counseling:[];
  const isAdmin = user.role === "admin";

  return (
    <>
      <div className="app-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"12px 18px",maxWidth:900,margin:"0 auto",flexWrap:"wrap",position:"sticky",top:0,zIndex:100,background:"var(--card-bg)",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontWeight:900,fontSize:18,color:"var(--text)"}}>MindGuard</div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,opacity:0.7,color:"var(--text)"}}>Hi, {user.name} {isAdmin && "👑"} | SOS: {user.emergencyPhone}</span>
          {isAdmin && <button onClick={()=>navigate("/admin")} style={{padding:"6px 10px",borderRadius:20,border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>👑 Admin REDs</button>}
          <button onClick={()=>{localStorage.clear(); location.reload()}} style={{padding:"6px 12px",borderRadius:20,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text)",cursor:"pointer",fontSize:12,fontWeight:700}}>Logout</button>
          <ThemeToggle />
        </div>
      </div>

      <div style={{maxWidth:720,margin:"18px auto",padding:"0 16px"}}>
        <p style={{fontSize:12,opacity:0.6,color:"var(--muted)"}}><b>Enter</b> to Analyze • <b>Shift+Enter</b> for new line</p>
        <textarea rows={5} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); handleAnalyze()}}} placeholder="Type here..." style={{width:"100%",padding:14,borderRadius:12,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text)",resize:"vertical"}} />
        <div style={{display:"flex",gap:10,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={handleAnalyze} disabled={loading} style={{padding:"10px 18px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#8b5cf6,#6366f1)",color:"#fff",fontWeight:800}}>{loading?"Analyzing...":"Analyze (Enter)"}</button>
          <button onClick={()=>listening?stopListening():startListening()} style={{padding:"10px 18px",borderRadius:20}}>🎙 {listening?"Stop":"Speak"}</button>
          <button onClick={()=>{setInputText("");setAnalysis(null)}} style={{padding:"10px 18px",borderRadius:20}}>Clear</button>
        </div>

        {analysis && (
          <div style={{marginTop:16}}>
            {analysis.riskLevel==="RED" && (
              <div style={{padding:16,background:"#fee2e2",border:"2px solid #ef4444",borderRadius:12,color:"#991b1b",marginBottom:12}}>
                <b>🚨 RED CODE - CRITICAL</b><div style={{fontSize:13,marginTop:6}}>Detected: "{analysis.text.slice(0,80)}" | SOS: {user.emergencyPhone}</div>
                <a href={`tel:${user.emergencyPhone}`} style={{display:"inline-block",marginTop:8,padding:"8px 14px",background:"#dc2626",color:"#fff",borderRadius:8,textDecoration:"none",fontWeight:700}}>📞 Call SOS: {user.emergencyPhone}</a>
              </div>
            )}
            <RiskCard analysis={analysis} text={analysis.text} />
            <MoodChart history={history.length?history:[analysis]} />
            <div style={{marginTop:12,padding:12,border:"1px solid var(--border)",borderRadius:12,background:"var(--card-bg)",color:"var(--text"}}><b>Advice:</b> {advice}</div>
            {counselingArray.length>0 && <div style={{marginTop:12}}><h4>Solutions ({counselingArray.length})</h4>{counselingArray.map((c,i)=><div key={i} style={{padding:10,border:"1px solid var(--border)",borderRadius:10,marginTop:8,background:"var(--card-bg)"}}><b>{c.technique}</b><p>{c.advice}</p></div>)}</div>}
          </div>
        )}
        <div style={{marginTop:20}}><VoiceToneAnalyzer onResult={setVoiceData} /><MoodTracker /><Journal /><GroundingExercises /><TeleManas /></div>
      </div>
    </>
  );
}