import React from "react";

export default function RiskCard({ analysis }) {
  if (!analysis) return null;
  const level = String(analysis.riskLevel || analysis.level || "GREEN").toUpperCase();
  const score = analysis.score?? 0;
  const isRed = level === "RED";
  const isOrange = level === "ORANGE";

  const colors = {
    GREEN: { bg: "#16a34a", text: "#fff" },
    YELLOW: { bg: "#eab308", text: "#000" },
    ORANGE: { bg: "#f97316", text: "#fff" },
    RED: { bg: "#d4c5a0", text: "#000" }, // FIXED: No scary red, use warm gold for RED badge
  };
  const c = colors[level] || colors.GREEN;

  // FIX: Logic to prevent "RED - 95 positive" contradiction
  let displaySentiment = analysis.sentiment || "neutral";
  if (isRed) displaySentiment = "needs support";
  else if (isOrange) displaySentiment = "distressed";

  const shouldShowEmotion = true;
  const shouldShowSentiment = true; // Always show, but with fixed value

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
        {shouldShowEmotion && (
          <span style={{
            background: "var(--card-bg)", color: "var(--text)",
            border:"1px solid var(--border)", padding:"6px 12px",
            borderRadius: 20, fontSize:12, fontWeight:700
          }}>
            {String(analysis.emotion || "neutral").toUpperCase()}
          </span>
        )}
        {shouldShowSentiment && (
          <span style={{
            background: isRed? "rgba(212,197,160,0.15)" : isOrange? "rgba(251,146,60,0.12)" : "var(--card-bg)",
            color: isRed? "#d4c5a0" : isOrange? "#fb923c" : "var(--muted)",
            border:"1px solid var(--border)", padding:"6px 12px",
            borderRadius: 20, fontSize:12, fontWeight:600
          }}>
            {/* FIXED: Never shows "positive" when RED */}
            {String(displaySentiment)}
          </span>
        )}
        {analysis.category === "emotional_abuse" && (
          <span style={{
            background: "rgba(251,146,60,0.15)", color: "#fb923c",
            border:"1px solid rgba(251,146,60,0.3)", padding:"6px 12px",
            borderRadius: 20, fontSize:11, fontWeight:700
          }}>
            ⚠️ ABUSE
          </span>
        )}
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
      {analysis.source && (
        <p style={{marginTop:8, fontSize:10, color:"rgba(232,220,198,0.4)"}}>
          via {analysis.source} {analysis.isAI? "🤖" : "🛡️"}
        </p>
      )}
    </div>
  );
}