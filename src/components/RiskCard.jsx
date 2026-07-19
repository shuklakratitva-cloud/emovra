import React from 'react';

// ✅ Safe converter: object -> string, prevents React crash
function toStr(v){ 
  if(v==null) return 'neutral'; 
  if(typeof v==='string') return v; 
  if(typeof v==='object') return String(v.label||v.dominant||v.emotion||v.level||'neutral'); 
  return String(v); 
}

export default function RiskCard({ analysis }){
  if(!analysis) return null;
  
  // ✅ All converted to string before render
  const riskLevel = toStr(analysis.riskLevel).toUpperCase();
  const emotion = toStr(analysis.emotion);
  const sentiment = toStr(analysis.sentiment);
  const score = analysis.score ?? 0;
  const reasons = Array.isArray(analysis.reasons) ? analysis.reasons.map(toStr) : [];
  
  // ✅ Now color always works because riskLevel is guaranteed string
  const color = riskLevel==='GREEN'?'#22c55e':riskLevel==='YELLOW'?'#eab308':riskLevel==='ORANGE'?'#f97316':'#ef4444';
  
  return (
    <div style={{
      borderLeft:`6px solid ${color}`,
      padding:20,
      borderRadius:12,
      border:'1px solid var(--border, #eee)',
      marginTop:20,
      maxWidth:680,
      width:"100%",
      background:"var(--card-bg, #fff)"
    }}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{background:color,color:'#fff',padding:'4px 12px',borderRadius:20,fontWeight:700,fontSize:12}}>
          {riskLevel}
        </span>
        <span style={{background:'#f1f5f9',padding:'4px 10px',borderRadius:20,fontSize:12}}>
          {emotion}
        </span>
        <span style={{background:'#f1f5f9',padding:'4px 10px',borderRadius:20,fontSize:12}}>
          {sentiment}
        </span>
        <span style={{fontSize:12,opacity:.6}}>
          Score: {String(score)}
        </span>
      </div>
      <div style={{marginTop:10,fontSize:13,opacity:.8}}>
        {reasons.join(', ')}
      </div>
    </div>
  );
}