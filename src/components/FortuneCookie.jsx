import React, { useState } from "react";

const MESSAGES = [
  "You don't have to have it figured out today. Showing up is enough.",
  "Small steps still count as moving forward.",
  "Whatever today held, you made it through. That's not nothing.",
  "You are allowed to take up space and rest without earning it first.",
  "The fact that you're trying already says something good about you.",
  "You're not behind. You're exactly where you are.",
  "Someone out there is genuinely glad you exist.",
  "You've survived every hard day so far. That's a real track record.",
  "It's okay to be proud of getting through an ordinary day.",
  "Growth is rarely a straight line - today still counts.",
  "You don't owe anyone constant positivity. Feeling what you feel is enough.",
  "The version of you a year from now is being shaped by small moments like this one.",
  "You're allowed to change your mind, your plans, and your pace.",
  "Being kind to yourself today is not a small thing.",
  "You've made it through 100% of your hardest days. That's worth noticing.",
];

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

export default function FortuneCookie() {
  const [cracked, setCracked] = useState(false);
  const message = MESSAGES[todaySeed() % MESSAGES.length];

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <h2>🥠 Today's Fortune</h2>
      {!cracked ? (
        <div>
          <div style={{ fontSize: 56, margin: "16px 0", cursor: "pointer" }} onClick={() => setCracked(true)}>
            🥠
          </div>
          <button onClick={() => setCracked(true)} style={{ padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            Crack it open
          </button>
        </div>
      ) : (
        <div style={{ padding: "20px 10px" }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-h)", fontStyle: "italic" }}>"{message}"</p>
          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>New one tomorrow</p>
        </div>
      )}
    </div>
  );
}
