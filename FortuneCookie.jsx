import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const MESSAGE_KEYS = [
  "fortune.msg.0",
  "fortune.msg.1",
  "fortune.msg.2",
  "fortune.msg.3",
  "fortune.msg.4",
  "fortune.msg.5",
  "fortune.msg.6",
  "fortune.msg.7",
  "fortune.msg.8",
  "fortune.msg.9",
  "fortune.msg.10",
  "fortune.msg.11",
  "fortune.msg.12",
  "fortune.msg.13",
  "fortune.msg.14",
];

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

export default function FortuneCookie() {
  const { t } = useLanguage();
  const [cracked, setCracked] = useState(false);
  const message = t(MESSAGE_KEYS[todaySeed() % MESSAGE_KEYS.length]);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <h2>🥠 {t("fortune.title")}</h2>
      {!cracked ? (
        <div>
          <div style={{ fontSize: 56, margin: "16px 0", cursor: "pointer" }} onClick={() => setCracked(true)}>
            🥠
          </div>
          <button onClick={() => setCracked(true)} style={{ padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {t("fortune.crack")}
          </button>
        </div>
      ) : (
        <div style={{ padding: "20px 10px" }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-h)", fontStyle: "italic" }}>"{message}"</p>
          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>{t("fortune.newTomorrow")}</p>
        </div>
      )}
    </div>
  );
}
