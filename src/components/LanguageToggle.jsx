// src/components/LanguageToggle.jsx
import React from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LanguageToggle({ style }) {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      title={lang === "en" ? "हिंदी में देखें" : "View in English"}
      style={{
        border: "0.5px solid rgba(212,197,160,0.4)",
        background: "transparent",
        color: "#d4c5a0",
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600,
        ...style,
      }}
    >
      {lang === "en" ? "हिं" : "EN"}
    </button>
  );
}
