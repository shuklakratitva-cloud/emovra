import React from "react";

const AFFIRMATIONS = [
  "I am allowed to take up space, even on hard days.",
  "I don't have to be perfect to be worthy of care.",
  "I am doing better than I'm giving myself credit for.",
  "My feelings are valid, even when they're inconvenient.",
  "I get to move at my own pace today.",
  "I am capable of handling what today brings.",
  "I am not behind - I am exactly where I am.",
  "I deserve the same patience I'd give a friend.",
  "It's okay to rest before I'm completely worn out.",
  "I am allowed to change my mind about what I need.",
];

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

export default function DailyAffirmation() {
  const text = AFFIRMATIONS[todaySeed() % AFFIRMATIONS.length];
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <h2 style={{ margin: 0 }}>🪞 Today's Affirmation</h2>
      <p style={{ fontSize: 16, marginTop: 14, color: "var(--text-h)", fontStyle: "italic", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
