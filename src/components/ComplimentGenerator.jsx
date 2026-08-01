import React, { useState } from "react";

const TRAITS = ["thoughtful", "resilient", "genuinely funny", "a good listener", "braver than you realize", "someone people trust", "creative in ways you don't notice", "someone who shows up for people", "handling more than you let on", "worth knowing"];

export default function ComplimentGenerator() {
  const [compliment, setCompliment] = useState(null);

  function generate() {
    const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
    setCompliment(`You are ${trait}.`);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <h2 style={{ margin: 0 }}>✨ Compliment Generator</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>For you, or copy it and send it to someone who needs it.</p>
      <button onClick={generate} style={{ marginTop: 14, padding: "10px 22px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        Generate
      </button>
      {compliment && <p style={{ marginTop: 16, fontSize: 16, color: "var(--text-h)" }}>{compliment}</p>}
    </div>
  );
}
