import React from "react";

export default function RiskCard({ analysis }) {
  if (!analysis) return null;
  const level = String(analysis.riskLevel || analysis.risk || analysis.level || "GREEN").toUpperCase();
  const score = analysis.score?? 0;
  const isRed = level === "RED";
  const isOrange = level === "ORANGE";
  const isGreen = level === "GREEN";

  const colors = {
    GREEN: { bg: "#16a34a", text: "#fff" },
    YELLOW: { bg: "#eab308", text: "#000" },
    ORANGE: { bg: "#f97316", text: "#fff" },
    RED: { bg: "#d4c5a0", text: "#000" },
  };
  const c = colors[level] || colors.GREEN;

  let displaySentiment = analysis.sentiment || "neutral";
  if (isRed) displaySentiment = "needs support";
  else if (isOrange) displaySentiment = analysis.category === "school_emotional_abuse"? "humiliated - needs support" : "distressed";

  // FIX: Never show "error" as trigger - your screenshot bug
  const cleanReasons = (analysis.reasons || analysis.triggers || ["general"])
   .filter(r => r && r.toLowerCase()!== "error")
   .map(r => r === "teacher_remark"? "teacher remark (school)" : r);
  const finalReasons = cleanReasons.length? cleanReasons : ["general"];

  const category = analysis.category || analysis.abuseType || "general";
  const isSchoolAbuse = category === "school_emotional_abuse" || analysis.abuseType === "school_emotional_abuse";
  const isHomeAbuse = category === "emotional_abuse" || analysis.abuseType === "home_abuse";

  return (
    <div style={{
      maxWidth: 680, width: "100%", marginTop: 16,
      background: "var(--card-bg)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 20, textAlign: "left",
      color: "var(--text)"
    }}>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
        <span style={{
          background: c.bg, color: c.text, padding:"6px 14px",
          borderRadius: 20, fontWeight: 800, fontSize: 13,
          border: `1px solid ${c.bg}`
        }}>
          {isRed? `🫂 ${level}` : level} - {score}%
        </span>
        <span style={{
          background: "var(--card-bg)", color: "var(--text)",
          border:"1px solid var(--border)", padding:"6px 12px",
          borderRadius: 20, fontSize:12, fontWeight:700
        }}>
          {String(analysis.emotion || "neutral").toUpperCase()}
        </span>
        <span style={{
          background: isRed? "rgba(212,197,160,0.15)" : isOrange? "rgba(251,146,60,0.12)" : "var(--card-bg)",
          color: isRed? "#d4c5a0" : isOrange? "#fb923c" : "var(--muted)",
          border:"1px solid var(--border)", padding:"6px 12px",
          borderRadius: 20, fontSize:12, fontWeight:600
        }}>
          {String(displaySentiment)}
        </span>

        {isHomeAbuse && (
          <span style={{
            background: "rgba(251,146,60,0.15)", color: "#fb923c",
            border:"1px solid rgba(251,146,60,0.3)", padding:"6px 12px",
            borderRadius: 20, fontSize:11, fontWeight:700
          }}>
            ⚠ HOME ABUSE
          </span>
        )}

        {isSchoolAbuse && (
          <span style={{
            background: "rgba(168,85,247,0.15)", color: "#c4b5fd",
            border:"1px solid rgba(168,85,247,0.3)", padding:"6px 12px",
            borderRadius: 20, fontSize:11, fontWeight:700
          }}>
            🏫 SCHOOL ABUSE - {analysis.abuseSource || "teacher"}
          </span>
        )}

        {isGreen && (
          <span style={{
            background: "rgba(34,197,94,0.1)", color: "#4ade80",
            border:"1px solid rgba(34,197,94,0.2)", padding:"4px 10px",
            borderRadius: 20, fontSize:10, fontWeight:600
          }}>
            🔒 Privacy: Not saved to backend
          </span>
        )}
        {(isRed || isOrange) && (
          <span style={{
            background: "rgba(212,197,160,0.1)", color: "#d4c5a0",
            border:"1px solid rgba(212,197,160,0.2)", padding:"4px 10px",
            borderRadius: 20, fontSize:10, fontWeight:600
          }}>
            🔐 Encrypted → Alerts
          </span>
        )}
      </div>

      <p style={{marginTop:12, fontSize:13, color:"var(--muted)"}}>
        <b style={{color:"var(--text)"}}>Triggers:</b> {finalReasons.join(", ")}
      </p>

      {isSchoolAbuse && (
        <div style={{marginTop:10, padding:10, background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:10, fontSize:12}}>
          <b style={{color:"#c4b5fd"}}>🏫 School Emotional Abuse Detected</b>
          <div style={{marginTop:4, color:"rgba(232,220,198,0.7)"}}>
            Teacher subtle remark / public shaming detected. Type: {analysis.abuseType} | Source: {analysis.abuseSource}
          </div>
        </div>
      )}

      {analysis.advice && (
        <p style={{marginTop:10, fontSize:13, color:"var(--text)", lineHeight:1.4}}>
          <b style={{color:"#d4c5a0"}}>Advice:</b> {analysis.advice}
        </p>
      )}

      {analysis.helpline && (
        <p style={{marginTop:8, fontSize:13, fontWeight:700, color: c.bg}}>
          {analysis.helpline}
        </p>
      )}
      {analysis.source && (
        <p style={{marginTop:8, fontSize:10, color:"rgba(232,220,198,0.4)"}}>
          via {analysis.source} {analysis.isAI? "🤖" : "🛡"} {analysis.category && `| ${analysis.category}`}
        </p>
      )}
    </div>
  );
}
