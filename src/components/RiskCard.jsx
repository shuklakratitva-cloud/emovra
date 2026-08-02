import React, { useMemo } from "react";
import { getGreenMessage, getYellowMessage, getOrangeMessage, getRedMessage } from "../utils/motivationalMessages";

// No more GREEN/YELLOW/ORANGE/RED badges or raw scores anywhere in this
// card, for ANY level. Underneath, the actual risk detection, encryption,
// and backend saving rules are 100% unchanged - this file only controls
// what's displayed, not what's detected or stored.
//
// Tone ladder (see utils/motivationalMessages.js for the full reasoning):
//   GREEN  - full hype/celebration energy
//   YELLOW - warm check-in, gentle self-care nudge, not urgent
//   ORANGE - honest acknowledgment + helpline visible
//   RED    - direct, warm, never hype - helpline front and center
//
// YELLOW previously had no branch at all here and silently fell into the
// RED styling - fixed below.

export default function RiskCard({ analysis, userName, emergencyPhone }) {
  if (!analysis) return null;
  const level = String(analysis.riskLevel || analysis.risk || analysis.level || "GREEN").toUpperCase();
  const isRed = level === "RED";
  const isOrange = level === "ORANGE";
  const isYellow = level === "YELLOW";
  const isGreen = level === "GREEN" || (!isRed && !isOrange && !isYellow); // safe default

  const category = analysis.category || analysis.abuseType || "general";
  const isSchoolAbuse = category === "school_emotional_abuse" || analysis.abuseType === "school_emotional_abuse";
  const isHomeAbuse = category === "emotional_abuse" || analysis.abuseType === "home_abuse";
  const triggers = analysis.reasons || analysis.triggers || [];

  const { message, icon, accent, heading } = useMemo(() => {
    if (isRed) {
      return {
        message: getRedMessage({ name: userName }),
        icon: "🫂", accent: "#f87171", heading: "You're not alone in this",
      };
    } else if (isOrange) {
      return {
        message: getOrangeMessage({ name: userName, category, abuseType: analysis.abuseType, triggers }),
        icon: isSchoolAbuse ? "🏫" : isHomeAbuse ? "⚠" : "💛",
        accent: "#fb923c", heading: "We hear you",
      };
    } else if (isYellow) {
      return {
        message: getYellowMessage({ name: userName, triggers }),
        icon: "🌤", accent: "#eab308", heading: "Just checking in",
      };
    } else {
      return {
        message: getGreenMessage(analysis.emotion, userName),
        icon: "🌿", accent: "#4ade80", heading: "You're on the right path",
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  const isCalm = isGreen; // only GREEN gets the fully neutral border treatment

  return (
    <div style={{
      maxWidth: 680, width: "100%", marginTop: 16,
      background: "var(--card-bg)",
      border: `1px solid ${isCalm ? "var(--border)" : accent + "55"}`,
      borderLeft: isCalm ? "1px solid var(--border)" : `3px solid ${accent}`,
      borderRadius: 16, padding: 22, textAlign: "left",
      color: "var(--text)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 700, color: "#d4c5a0", fontSize: 15 }}>{heading}</span>
      </div>

      <p style={{ marginTop: 10, fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
        {message}
      </p>

      {/* Always-visible, always-tappable help for RED/ORANGE - kept
          regardless of styling changes, this is the safety function of
          the card, not decoration. */}
      {(isRed || isOrange) && (
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="tel:14416" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#d4b07a", color: "#000", padding: "10px 18px",
            borderRadius: 20, textDecoration: "none", fontWeight: 700, fontSize: 13
          }}>
            📞 Call Tele-MANAS: 14416
          </a>
          {isRed && (
            <a href="tel:18005990019" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", color: "var(--text)", padding: "10px 18px",
              borderRadius: 20, textDecoration: "none", fontWeight: 600, fontSize: 13,
              border: "1px solid var(--border)"
            }}>
              📞 Kiran: 1800-599-0019
            </a>
          )}
          {isRed && emergencyPhone && (
            <a href={`tel:${emergencyPhone}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", color: "var(--text)", padding: "10px 18px",
              borderRadius: 20, textDecoration: "none", fontWeight: 600, fontSize: 13,
              border: "1px solid var(--border)"
            }}>
              📞 Call Your SOS: {emergencyPhone}
            </a>
          )}
        </div>
      )}

      {/* FIX: per request, GREEN and YELLOW no longer show any helpline
          link at all - only RED/ORANGE do. The warm "Just checking in"
          message above still applies to YELLOW, just without the link. */}

      {analysis.emotion && (
        <div style={{ marginTop: 12 }}>
          <span style={{
            background: "rgba(212,197,160,0.12)", color: "#d4c5a0",
            border: "1px solid rgba(212,197,160,0.25)", padding: "4px 12px",
            borderRadius: 20, fontSize: 11, fontWeight: 600
          }}>
            feeling {String(analysis.emotion).toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}
