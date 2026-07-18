import { useEffect, useState } from 'react';

export default function MoodChart({ history = [] }) {
  const [data, setData] = useState(history);

  useEffect(() => {
    setData(history);
  }, [history]);

  if (!data || data.length === 0) {
    return (
      <div style={{maxWidth:680,width:"100%",marginTop:16,padding:16,border:"1px solid var(--border)",borderRadius:12,background:"var(--card-bg)",textAlign:"left"}}>
        <strong>📈 Mood History</strong>
        <p style={{opacity:0.6,marginTop:8,fontSize:13}}>No history yet. Analyze 2+ moods to see your trend line.</p>
      </div>
    );
  }

  // Convert riskLevel to number for graph
  const levelToNum = (lvl) => {
    if(lvl==="GREEN") return 1;
    if(lvl==="YELLOW") return 2;
    if(lvl==="ORANGE") return 3;
    if(lvl==="RED") return 4;
    return 1;
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
          {/* grid lines */}
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="var(--border)" strokeDasharray="3 3"/>
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="var(--border)" strokeDasharray="3 3"/>
          {/* line */}
          <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" points={points} strokeLinejoin="round" strokeLinecap="round"/>
          {/* dots */}
          {data.map((h,i)=>{
            const x = padding + i * stepX;
            const y = height - padding - (levelToNum(h.riskLevel)/maxScore)*(height-padding*2);
            return <circle key={h.id||i} cx={x} cy={y} r="6" fill={h.riskLevel==="GREEN"?"#22c55e":h.riskLevel==="YELLOW"?"#eab308":h.riskLevel==="ORANGE"?"#f97316":"#ef4444"} stroke="white" strokeWidth="2"/>
          })}
        </svg>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
        {data.slice(-10).map((h,i)=>(
          <span key={h.id||i} style={{fontSize:11,padding:"4px 8px",borderRadius:20,background:h.riskLevel==="GREEN"?"#dcfce7":"#fef3c7",color:"#333",border:"1px solid #e5e7eb"}}>
            {h.riskLevel} - {h.emotion||'mood'} Score:{h.score}
          </span>
        ))}
      </div>
      <small style={{opacity:0.5,display:"block",marginTop:8}}>Tip: Refresh page - this history will STAY. That's persistence working.</small>
    </div>
  );
}