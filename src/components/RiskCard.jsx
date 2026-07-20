import React from 'react';
import { analyzeRisk } from "../utils/analyzeRisk.js";

function toStr(v){
  if(v==null) return 'neutral';
  if(typeof v==='string') return v;
  if(typeof v==='object') return String(v.label||v.dominant||v.emotion||v.level||'neutral');
  return String(v);
}

export default function RiskCard({ analysis, text }){
  // NEW: If parent passes text, or if score is 0, recalculate with sensitive analyzer
  const liveAnalysis = text? analyzeRisk(text) : analysis;

  // If score is 0 but text has stress, force recalculate
  let finalAnalysis = liveAnalysis;
  if (liveAnalysis && liveAnalysis.score === 0 && liveAnalysis.reasons?.length > 0) {
     finalAnalysis = liveAnalysis;
  }
  if (!finalAnalysis) return null;

  const riskLevel = toStr(finalAnalysis.riskLevel).toUpperCase();
  const emotion = toStr(finalAnalysis.emotion);
  const sentiment = toStr(finalAnalysis.sentiment);
  const score = finalAnalysis.score?? 0;
  const reasons = Array.isArray(finalAnalysis.reasons)? finalAnalysis.reasons.map(toStr) : [];

  const color = riskLevel==='GREEN'?'#22c55e':riskLevel==='YELLOW'?'#eab308':riskLevel==='ORANGE'?'#f97316':'#ef4444';

  return (
    <div style={{
      borderLeft:`6px solid ${color}`,
      padding:20, borderRadius:12, border:'1px solid var(--border, #eee)',
      marginTop:20, maxWidth:680, width:"100%", background:"var(--card-bg, #fff)"
    }}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{background:color,color:'#fff',padding:'4px 12px',borderRadius:20,fontWeight:700,fontSize:12}}>{riskLevel} - {score}</span>
        <span style={{background:'#f1f5f9',padding:'4px 10px',borderRadius:20,fontSize:12}}>{emotion}</span>
        <span style={{background:'#f1f5f9',padding:'4px 10px',borderRadius:20,fontSize:12}}>{sentiment}</span>
      </div>
      <div style={{marginTop:10,fontSize:13,opacity:.8}}>Triggers: {reasons.join(', ') || 'none'}</div>
      {score > 0 && score <= 20 && <div style={{marginTop:8,fontSize:12,color:'#a16207'}}>🌿 Slight stress detected - try breathing exercise</div>}
    </div>
  );
}