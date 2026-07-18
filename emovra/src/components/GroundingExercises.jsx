// src/components/GroundingExercises.jsx

import React, { useState } from "react";
import { GROUNDING_EXERCISES } from "../data/exercises";

export default function GroundingExercises() {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!GROUNDING_EXERCISES || GROUNDING_EXERCISES.length === 0) {
    return <div style={{ padding: 24 }}>No grounding exercises configured.</div>;
  }

  const exercise = GROUNDING_EXERCISES[currentIndex];
  if (!exercise) return null;

  function nextExercise() {
    setCurrentIndex((i) => Math.min(i + 1, GROUNDING_EXERCISES.length - 1));
  }
  function previousExercise() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div style={{ background: "var(--card-bg, #ffffff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🧘 Grounding Exercises</h2>
      <p>Follow these exercises whenever you feel stressed, anxious, overwhelmed, or emotionally distressed.</p>
      <hr />
      <h3>{exercise.title}</h3>
      <p><strong>Description:</strong></p>
      <p>{exercise.description}</p>
      <p><strong>Duration:</strong> {exercise.duration}</p>
      <h4>Steps</h4>
      <ol>{exercise.steps.map((step, index) => <li key={index} style={{ marginBottom: "10px" }}>{step}</li>)}</ol>
      <hr />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <button onClick={previousExercise} disabled={currentIndex === 0} style={{ padding: "10px 20px", cursor: currentIndex === 0 ? "not-allowed" : "pointer" }}>⬅ Previous</button>
        <span style={{ alignSelf: "center", fontWeight: "bold" }}>{currentIndex + 1} / {GROUNDING_EXERCISES.length}</span>
        <button onClick={nextExercise} disabled={currentIndex === GROUNDING_EXERCISES.length - 1} style={{ padding: "10px 20px", cursor: currentIndex === GROUNDING_EXERCISES.length - 1 ? "not-allowed" : "pointer" }}>Next ➡</button>
      </div>
    </div>
  );
}