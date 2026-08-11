import { useState, useRef, useEffect } from "react";

const API = "https://emovra.onrender.com/api";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey - how are you doing today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", text: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "I'm here, go on." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Having trouble connecting - try again in a moment?" }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", display: "flex", flexDirection: "column", minHeight: 220, maxHeight: 480 }}>
      <h2 style={{ margin: 0 }}>💬 Talk to Emovra AI</h2>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Asks follow-up questions to understand you better - not a replacement for a real person or professional.</p>

      <div style={{ overflowY: "auto", marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%",
            background: m.role === "user" ? "#d4b07a" : "rgba(212,197,160,0.1)",
            color: m.role === "user" ? "#000" : "var(--text)",
            border: m.role === "user" ? "none" : "1px solid var(--border)",
            padding: "10px 14px",
            borderRadius: 16,
            fontSize: 13.5,
            lineHeight: 1.5,
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
            Emovra is typing...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          style={{ flex: 1, resize: "none", padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontFamily: "inherit" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "0 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
