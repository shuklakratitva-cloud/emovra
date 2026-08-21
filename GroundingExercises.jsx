import React, { useState } from "react";
import { GROUNDING_EXERCISES } from "../data/exercises";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";

export default function GroundingExercises() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markedDone, setMarkedDone] = useState(false);
  const { t, lang } = useLanguage();

  if (!GROUNDING_EXERCISES || GROUNDING_EXERCISES.length === 0) {
    return <div style={{ padding: 24 }}>{t("groundingExercises.notConfigured")}</div>;
  }

  const exercise = GROUNDING_EXERCISES[currentIndex];
  if (!exercise) return null;

  const isHi = lang === "hi";
  const exTitle = isHi && exercise.title_hi ? exercise.title_hi : exercise.title;
  const exDescription = isHi && exercise.description_hi ? exercise.description_hi : exercise.description;
  const exDuration = isHi && exercise.duration_hi ? exercise.duration_hi : exercise.duration;
  const exSteps = isHi && exercise.steps_hi ? exercise.steps_hi : exercise.steps;

  function nextExercise() {
    setCurrentIndex((i) => Math.min(i + 1, GROUNDING_EXERCISES.length - 1));
  }
  function previousExercise() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function markDone() {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/activity/grounding-checkin`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      .then(() => setMarkedDone(true))
      .catch(() => {});
  }

  return (
    <div style={{ background: "var(--card-bg, #ffffff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🧘 {t("groundingExercises.heading")}</h2>
      <p>{t("groundingExercises.intro")}</p>
      <hr />
      <h3>{exTitle}</h3>
      <p><strong>{t("groundingExercises.descriptionLabel")}</strong></p>
      <p>{exDescription}</p>
      <p><strong>{t("groundingExercises.durationLabel")}</strong> {exDuration}</p>
      <h4>{t("groundingExercises.stepsHeading")}</h4>
      <ol>{exSteps.map((step, index) => <li key={index} style={{ marginBottom: "10px" }}>{step}</li>)}</ol>
      <hr />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <button onClick={previousExercise} disabled={currentIndex === 0} style={{ padding: "10px 20px", cursor: currentIndex === 0 ? "not-allowed" : "pointer" }}>⬅ {t("groundingExercises.previous")}</button>
        <span style={{ alignSelf: "center", fontWeight: "bold" }}>{currentIndex + 1} / {GROUNDING_EXERCISES.length}</span>
        <button onClick={nextExercise} disabled={currentIndex === GROUNDING_EXERCISES.length - 1} style={{ padding: "10px 20px", cursor: currentIndex === GROUNDING_EXERCISES.length - 1 ? "not-allowed" : "pointer" }}>{t("groundingExercises.next")} ➡</button>
      </div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button onClick={markDone} disabled={markedDone} style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: markedDone ? "#4ade80" : "var(--accent, #d4b07a)", color: "#000", fontWeight: 700, cursor: markedDone ? "default" : "pointer" }}>
          {markedDone ? `✓ ${t("groundingExercises.markedDone")}` : t("groundingExercises.markDone")}
        </button>
      </div>
    </div>
  );
}
