import React, { useMemo } from "react";
import { getGreenMessage, getYellowMessage, getOrangeMessage, getRedMessage } from "../utils/motivationalMessages";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function RiskCard({ analysis, userName, emergencyPhone, safetyPlan }) {
  const { t } = useLanguage();
  const level = String(analysis?.riskLevel || analysis?.risk || analysis?.level || "GREEN").toUpperCase();
  const isRed = level === "RED";
  const isOrange = level === "ORANGE";
  const isYellow = level === "YELLOW";
  const isGreen = level === "GREEN" || (!isRed && !isOrange && !isYellow);

  const category = analysis?.category || analysis?.abuseType || "general";
  const isSchoolAbuse = category === "school_emotional_abuse" || analysis?.abuseType === "school_emotional_abuse";
  const isHomeAbuse = category === "emotional_abuse" || analysis?.abuseType === "home_abuse";
  const triggers = analysis?.reasons || analysis?.triggers || [];

  const { message, icon, accent, heading } = useMemo(() => {
        if (!analysis) return {};
        if (isRed) {
      return {
        message: getRedMessage({ name: userName }),
        icon: "🫂", accent: "#f87171", heading: t("riskCard.headingRed"),
      };
    } else if (isOrange) {
      return {
        message: getOrangeMessage({ name: userName, category, abuseType: analysis.abuseType, triggers }),
        icon: isSchoolAbuse ? "🏫" : isHomeAbuse ? "⚠" : "💛",
        accent: "#fb923c", heading: t("riskCard.headingOrange"),
      };
    } else if (isYellow) {
      return {
        message: getYellowMessage({ name: userName, triggers }),
        icon: "🌤", accent: "#eab308", heading: t("riskCard.headingYellow"),
      };
    } else {
      return {
        message: getGreenMessage(analysis.emotion, userName),
        icon: "🌿", accent: "#4ade80", heading: t("riskCard.headingGreen"),
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, t]);

  const isCalm = isGreen;

  if (!analysis) return null;

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

            {(isRed || isOrange) && (
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="tel:14416" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#d4b07a", color: "#000", padding: "10px 18px",
            borderRadius: 20, textDecoration: "none", fontWeight: 700, fontSize: 13
          }}>
            📞 {t("riskCard.callTeleManas", { number: "14416" })}
          </a>
          {isRed && (
            <a href="tel:18005990019" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", color: "var(--text)", padding: "10px 18px",
              borderRadius: 20, textDecoration: "none", fontWeight: 600, fontSize: 13,
              border: "1px solid var(--border)"
            }}>
              📞 {t("riskCard.callKiran", { number: "1800-599-0019" })}
            </a>
          )}
          {isRed && emergencyPhone && (
            <a href={`tel:${emergencyPhone}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", color: "var(--text)", padding: "10px 18px",
              borderRadius: 20, textDecoration: "none", fontWeight: 600, fontSize: 13,
              border: "1px solid var(--border)"
            }}>
              📞 {t("riskCard.callYourSos", { number: emergencyPhone })}
            </a>
          )}
        </div>
      )}

            {isRed && safetyPlan && (safetyPlan.reasonsToLive || safetyPlan.copingStrategies) && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-h)", margin: "0 0 8px" }}>{t("riskCard.fromYourSafetyPlan")}</p>
          {safetyPlan.reasonsToLive && <p style={{ fontSize: 13, margin: "0 0 6px", lineHeight: 1.5 }}>{safetyPlan.reasonsToLive}</p>}
          {safetyPlan.copingStrategies && <p style={{ fontSize: 12, opacity: 0.75, margin: 0, lineHeight: 1.5 }}>{safetyPlan.copingStrategies}</p>}
        </div>
      )}

      {analysis.emotion && (
        <div style={{ marginTop: 12 }}>
          <span style={{
            background: "rgba(212,197,160,0.12)", color: "#d4c5a0",
            border: "1px solid rgba(212,197,160,0.25)", padding: "4px 12px",
            borderRadius: 20, fontSize: 11, fontWeight: 600
          }}>
            {t("riskCard.feelingEmotion", { emotion: String(analysis.emotion).toLowerCase() })}
          </span>
        </div>
      )}
    </div>
  );
}
