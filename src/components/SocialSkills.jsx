import React, { useState, useRef, useEffect } from "react";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// FIX: replaced the old static tip-list (conflict resolution / communication
// / social anxiety / healthy relationships as fixed text to read) with an
// actual listening chatbot - describe a real situation, get a reply that
// engages with the specifics and honestly points out patterns worth
// noticing, not generic advice. Reuses the same chatbot backend/safety net
// as "Talk to AI," just with a relationship-focused system prompt
// (mode: "relationship").
export default function SocialSkills() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "What's going on? Tell me about the situation - a friendship, family thing, or relationship - and I'll actually think it through with you." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", text: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chatbot`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ messages: next, mode: "relationship" }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "I'm here - go on." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Lost my train of thought there - try again?" }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🫂 Relationship Chat</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Describe a real situation - conflict, a friendship, family, relationships. Not a therapy substitute, just someone to think it through with.</p>

      <div style={{ marginTop: 14, maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
            background: m.role === "user" ? "var(--accent)" : "rgba(212,176,122,0.08)",
            color: m.role === "user" ? "#000" : "var(--text)",
            border: m.role === "user" ? "none" : "1px solid var(--border)",
            fontSize: 13, lineHeight: 1.5,
          }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", fontSize: 12, opacity: 0.5, padding: "4px 14px" }}>thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What happened?"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }}
        />
        <button onClick={send} disabled={loading} style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
