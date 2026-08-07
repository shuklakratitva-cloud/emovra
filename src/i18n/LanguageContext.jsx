// src/i18n/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("emovra_lang") || "en");

  useEffect(() => {
    localStorage.setItem("emovra_lang", lang);
  }, [lang]);

  function t(key) {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  }

  function toggleLang() {
    setLang((l) => (l === "en" ? "hi" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside a LanguageProvider");
  return ctx;
}
