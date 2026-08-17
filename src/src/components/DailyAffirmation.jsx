import React from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const AFFIRMATION_KEYS = [
  "affirmation.0",
  "affirmation.1",
  "affirmation.2",
  "affirmation.3",
  "affirmation.4",
  "affirmation.5",
  "affirmation.6",
  "affirmation.7",
  "affirmation.8",
  "affirmation.9",
];

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

export default function DailyAffirmation() {
  const { t } = useLanguage();
  const text = t(AFFIRMATION_KEYS[todaySeed() % AFFIRMATION_KEYS.length]);
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <h2 style={{ margin: 0 }}>🪞 {t("affirmation.title")}</h2>
      <p style={{ fontSize: 16, marginTop: 14, color: "var(--text-h)", fontStyle: "italic", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
