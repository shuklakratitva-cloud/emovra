import { useEffect, useState } from 'react';

// ✅ NEW: Safe converter for all cases (string, object, null)
function toStr(v){
  if(v==null) return 'GREEN';
  if(typeof v==='string') return v.toUpperCase();
  if(typeof v==='object') return String(v.level||v.label||v.riskLevel||'GREEN').toUpperCase();
  return String(v).toUpperCase();
}
function toEmotion(v){
  if(v==null) return 'neutral';
  if(typeof v==='string') return v;
  if(typeof v==='object') return String(v.label||v.dominant||v.emotion||'neutral');
  return String(v);
}

export default function MoodChart({ history = [] }) {
  const [data, setData] = useState(history);

  useEffect(() => {
    // ✅ NEW: Clean history on load - fixes old object entries
    const cleaned = (history||[]).map(h=>({
     ...h,
      riskLevel: toStr(h.riskLevel),
      emotion: toEmotion(h.emotion),
      score: h.score?? 0,
    }));
    setData(cleaned);
  }, [history]);

  if (!data || data.length === 0) {
    return (
      <div style={{maxWidth:680,width:"100%",marginTop:16,padding:16,border:"1px solid var(--border)",borderRadius:12,background:"var(--card-bg)",textAlign:"left"}}>
        <strong>📈 Mood History</strong>
        <p style={{opacity:0.6,marginTop:8,fontSize:13}}>No history yet. Analyze 2+ moods to see your trend line.</p>
      </div>
    );
  }

  const levelToNum = (lvl) => {
    const L = toStr(lvl); // ✅ FIXED: always string now
    if(L==="GREEN") return 1;
    if(L==="YELLOW") return 2;
    if(L==="ORANGE") return 3;
    if(L==="RED") return 4;
    return 1;
  };

  const getColor = (lvl) => {
    const L = toStr(lvl); // ✅ FIXED
    if(L==="GREEN") return "#22c55e";
    if(L==="YELLOW") return "#eab308";
    if(L==="ORANGE") return "#f97316";
    if(L==="RED") return "#ef4444";
    return "#22c55e";
  };

  const maxScore = 4;
  const width = 600;
  const height = 120;
  const padding = 20;
  const stepX = data.length > 1? (width - padding*2) / (data.length - 1) : 0;

  const points = data.map((h, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (levelToNum(h.riskLevel) / maxScore) * (height - padding*2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{maxWidth:680,width:"100%",marginTop:16,padding:16,border:"1px solid var(--border)",borderRadius:12,background:"var(--card-bg)",textAlign:"left"}}>
      <strong>📈 Mood History ({data.length} entries) - Persists after refresh</strong>
      <div style={{overflowX:"auto",marginTop:12}}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:140,display:"block"}}>
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>
          <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" points={points} strokeLinejoin="round" strokeLinecap="round"/>
          {data.map((h,i)=>{
            const x = padding + i * stepX;
            const y = height - padding - (levelToNum(h.riskLevel)/maxScore)*(height-padding*2);
            const color = getColor(h.riskLevel); // ✅ FIXED: uses safe getColor
            return <circle key={h.id||i} cx={x} cy={y} r="6" fill={color} stroke="white" strokeWidth="2"/>
          })}
        </svg>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
        {data.slice(-10).map((h,i)=>{
          const emo = toEmotion(h.emotion); // ✅ FIXED
          const level = toStr(h.riskLevel); // ✅ FIXED
          const bg = level==="RED"? "#fecaca" : level==="ORANGE"? "#ffedd5" : level==="YELLOW"? "#fef3c7" : "#dcfce7";
          const border = level==="RED"? "#fca5a5" : level==="ORANGE"? "#fdba74" : level==="YELLOW"? "#fde68a" : "#bbf7d0";
          const dot = getColor(level);
          return (
            <span key={h.id||i} style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:bg,color:"#1f2937",border:`1px solid ${border}`,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:dot,display:"inline-block"}}></span>
              {level} - {emo} Score:{String(h.score?? '')}
            </span>
          );
        })}
      </div>

      <small style={{opacity:0.5,display:"block",marginTop:8}}>Tip: Refresh page - this history will STAY. That's persistence working.</small>
    </div>
  );
}