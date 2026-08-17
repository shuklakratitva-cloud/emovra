import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" ||
           (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const { t } = useLanguage();

  useEffect(() => {
    const theme = dark? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 9999,
        padding: "8px 12px", borderRadius: 20,
        border: "1px solid var(--border)",
        background: "var(--card-bg)", color: "var(--text)",
        cursor: "pointer"
      }}
      aria-label={t("themeToggle.ariaLabel")}
    >
      {dark? `☀️ ${t("themeToggle.light")}` : `🌙 ${t("themeToggle.dark")}`}
    </button>
  );
}
