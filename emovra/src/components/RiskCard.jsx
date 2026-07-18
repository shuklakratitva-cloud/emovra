// src/components/RiskCard.jsx

import React from "react";

import {
  getRiskColor,
  getRiskEmoji,
  getRiskMessage,
} from "../utils/risk";

import {
  getEmotionEmoji,
  getEmotionLabel,
} from "../utils/emotion";

import {
  getSentimentEmoji,
  getSentimentColor,
} from "../utils/sentiment";

export default function RiskCard({ analysis }) {
  if (!analysis) return null;

  const {
    riskLevel = "GREEN",
    score = 0,
    emotion = "neutral",
    sentiment = "neutral",
    abuseDetected,
    suicideDetected,
    timestamp,
  } = analysis;

  const safeTimestamp = timestamp ? new Date(timestamp).toLocaleString() : "N/A";

  return (
    <div style={{ background: "var(--card-bg, #fff)", borderRadius: "16px", padding: "24px", marginTop: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <h2>Analysis Result</h2>
      <div style={{ background: getRiskColor(riskLevel), color: "#fff", padding: "15px", borderRadius: "12px", fontWeight: "bold", marginBottom: "20px", fontSize: "20px" }}>
        {getRiskEmoji(riskLevel)} {riskLevel}
      </div>
      <p><strong>Message:</strong> {getRiskMessage(riskLevel)}</p>
      <hr />
      <p><strong>Risk Score:</strong> {score}/100</p>
      <p><strong>Emotion:</strong> {getEmotionEmoji(emotion)} {getEmotionLabel(emotion)}</p>
      <p><strong>Sentiment:</strong> <span style={{ color: getSentimentColor(sentiment), fontWeight: "bold" }}>{getSentimentEmoji(sentiment)} {sentiment}</span></p>
      <p><strong>Emotional Abuse:</strong> {abuseDetected ? "⚠️ Detected" : "✅ Not Detected"}</p>
      <p><strong>Suicide Indicators:</strong> {suicideDetected ? "🔴 Detected" : "🟢 Not Detected"}</p>
      <hr />
      <small>Last Updated: {safeTimestamp}</small>
    </div>
  );
}