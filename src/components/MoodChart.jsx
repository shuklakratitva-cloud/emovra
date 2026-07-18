import React from "react";

export function MoodChart({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginTop:16,textAlign:"center",opacity:0.7}}>
        📈 No mood history yet — analyze a mood to see chart
      </div>
    );
  }

  return (
    <div style={{maxWidth:680,width:"100%",background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginTop:16}}>
      <h3 style={{margin:"0 0 12px 0"}}>📈 Mood History</h3>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {history.slice(-10).map((item, i) => (
          <div key={i} style={{
            padding:"8px 12px",
            borderRadius:8,
            background: item.riskLevel==="GREEN"?"#d1fae5":item.riskLevel==="YELLOW"?"#fef3c7":item.riskLevel==="ORANGE"?"#fed7aa":"#fecaca",
            fontSize:12,
            border:"1px solid var(--border)"
          }}>
            <b>{item.riskLevel || "GREEN"}</b> - {item.emotion || item.sentiment || "neutral"} <br/>
            <small>Score: {item.score || 0}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoodChart;