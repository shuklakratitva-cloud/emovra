// src/components/ThemeToggle.jsx

import React, { useState, useEffect } from "react";
import { saveTheme, loadTheme } from "../utils/storage";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  function applyTheme(selectedTheme) {
    document.documentElement.setAttribute("data-theme", selectedTheme);
    document.body.style.transition = "background-color 0.3s ease, color 0.3s ease";
  }

  useEffect(() => {
    const savedTheme = loadTheme() || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
      <button
        onClick={toggleTheme}
        style={{
          padding: "10px 18px",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          backgroundColor: theme === "dark" ? "#facc15" : "#1f2937",
          color: theme === "dark" ? "#000000" : "#ffffff",
          fontWeight: "bold",
        }}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
      </button>
    </div>
  );
}