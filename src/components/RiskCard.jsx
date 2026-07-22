import React from "react";

export default function RiskCard({ analysis }) {
  if (!analysis) return null;
  const level = String(analysis.riskLevel || analysis.level || "GREEN").toUpperCase();
  const score = analysis.score?? 0;

  const colors = {
    GREEN: { bg: "#16a34a", text: "#fff" },
    YELLOW: { bg: "#eab308", text: "#000" },
    ORANGE: { bg: "#f97316", text: "#fff" },
    RED: { bg: "#dc2626", text: "#fff" },
  };
  const c = colors[level] || colors.GREEN;

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
          {level} - {score}
        </span>
        <span style={{
          background: "var(--card-bg)", color: "var(--text)",
          border:"1px solid var(--border)", padding:"6px 12px",
          borderRadius: 20, fontSize:12, fontWeight:700
        }}>
          {String(analysis.emotion || "neutral").toUpperCase()}
        </span>
        <span style={{
          background: "var(--card-bg)", color: "var(--muted)",
          border:"1px solid var(--border)", padding:"6px 12px",
          borderRadius: 20, fontSize:12, fontWeight:600
        }}>
          {String(analysis.sentiment || "neutral")}
        </span>
      </div>

      {analysis.reasons?.length > 0 && (
        <p style={{marginTop:12, fontSize:13, color:"var(--muted)"}}>
          <b style={{color:"var(--text)"}}>Triggers:</b> {analysis.reasons.join(", ")}
        </p>
      )}
      {analysis.helpline && (
        <p style={{marginTop:8, fontSize:13, fontWeight:700, color: c.bg}}>
          {analysis.helpline}
        </p>
      )}
    </div>
  );
}