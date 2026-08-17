import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [reds, setReds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // NEW: all | self_harm | emotional_abuse | RED | ORANGE

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user.role !== "admin") {
      setError("Access denied: Your role is " + (user.role || "user"));
      setLoading(false);
      return;
    }
    const fetchReds = async () => {
      try {
        const res = await axios.get("https://emovra.onrender.com/api/admin/alerts", {
          headers: { Authorization: "Bearer " + token }
        });
        setReds(res.data || []);
      } catch (err) {
        setError(err.response?.data?.msg || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReds();
  }, []);

  const getCleanPhoneForWhatsApp = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, '');
  };

  // === NEW: FILTER LOGIC FOR SEPARATE SECTIONS ===
  const filteredReds = reds.filter((entry) => {
    const category = entry.category || (entry.triggers?.includes("emotional_abuse") ? "emotional_abuse" : "self_harm");
    const risk = (entry.riskLevel || entry.risk || "RED").toUpperCase();
    if (filter === "all") return true;
    if (filter === "self_harm") return category === "self_harm" || risk === "RED";
    if (filter === "emotional_abuse") return category === "emotional_abuse";
    if (filter === "RED") return risk === "RED";
    if (filter === "ORANGE") return risk === "ORANGE";
    return true;
  });

  const counts = {
    all: reds.length,
    self_harm: reds.filter(e => (e.category || "self_harm") === "self_harm" && (e.riskLevel || "RED").toUpperCase() === "RED").length,
    emotional_abuse: reds.filter(e => e.category === "emotional_abuse" || e.triggers?.includes("emotional_abuse")).length,
    RED: reds.filter(e => (e.riskLevel || e.risk || "RED").toUpperCase() === "RED").length,
    ORANGE: reds.filter(e => (e.riskLevel || e.risk || "").toUpperCase() === "ORANGE").length,
  };

  if (loading) return <div style={{ padding: 40 }}>Loading alerts...</div>;
  if (error) return <div style={{ padding: 40 }}><h2 style={{ color: "red" }}>{error}</h2><button onClick={() => { localStorage.clear(); window.location.href = "/app"; }}>Logout & Login Again</button></div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto", minHeight: "100vh", background: "#0a0a0c", color: "#e8dcc6" }}>
      <h1 style={{ color: "#d4c5a0" }}>Admin Panel - {filter === "emotional_abuse" ? "EMOTIONAL ABUSE" : filter === "self_harm" ? "SELF-HARM" : "ALL ALERTS"} ({filteredReds.length})</h1>
      <p style={{ color: "#666" }}>Abuse cases show full message content for review. Regular RED/ORANGE alerts show user info only - message content stays private. Sorted by most recent first.</p>

      {/* === NEW: TABS FOR SEPARATE SECTIONS === */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")} style={{ padding: "8px 16px", borderRadius: 20, border: "0.5px solid #d4c5a0", background: filter === "all" ? "#d4c5a0" : "transparent", color: filter === "all" ? "#000" : "#d4c5a0", cursor: "pointer", fontWeight: 700 }}>All ({counts.all})</button>
        <button onClick={() => setFilter("self_harm")} style={{ padding: "8px 16px", borderRadius: 20, border: "0.5px solid #ef4444", background: filter === "self_harm" ? "#ef4444" : "transparent", color: filter === "self_harm" ? "#fff" : "#fca5a5", cursor: "pointer", fontWeight: 700 }}>🚨 Self-Harm ({counts.RED})</button>
        <button onClick={() => setFilter("emotional_abuse")} style={{ padding: "8px 16px", borderRadius: 20, border: "0.5px solid #fb923c", background: filter === "emotional_abuse" ? "#fb923c" : "transparent", color: filter === "emotional_abuse" ? "#000" : "#fb923c", cursor: "pointer", fontWeight: 700 }}>⚠️ Emotional Abuse ({counts.emotional_abuse})</button>
        <button onClick={() => setFilter("ORANGE")} style={{ padding: "8px 16px", borderRadius: 20, border: "0.5px solid #f59e0b", background: filter === "ORANGE" ? "rgba(251,146,60,0.2)" : "transparent", color: "#fbbf24", cursor: "pointer", fontWeight: 700 }}>ORANGE ({counts.ORANGE})</button>
      </div>

      {filteredReds.length === 0 && <div style={{ background: "rgba(18,18,20,0.95)", padding: 30, borderRadius: 12, marginTop: 20, textAlign: "center", border: "0.5px solid rgba(212,197,160,0.18)" }}>No alerts in {filter} category. Try "my boyfriend beats me" or "i want to die" in main app to test.</div>}

      {filteredReds.map((entry) => {
        const userData = entry.userId || entry.user || {};
        const name = userData.name || entry.name || entry.userName || "Unknown";
        const email = userData.email || entry.email || entry.userEmail || "No email";
        const phone = userData.emergencyPhone || entry.emergencyPhone || entry.phone || "";
        const emergencyName = userData.emergencyName || entry.emergencyName || "Emergency Contact";
        const countryCode = userData.countryCode || "";
        const text = entry.text || entry.message || "";
        const textHidden = entry.textHidden === true;
        const triggers = entry.triggers ? entry.triggers.join(", ") : entry.emotion || "self-harm";
        const level = entry.score || entry.level || 98;
        const date = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : (entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "");
        const age = userData.age || entry.age || "";
        const category = entry.category || (triggers.includes("emotional_abuse") ? "emotional_abuse" : "self_harm");
        const riskLevel = (entry.riskLevel || entry.risk || "RED").toUpperCase();
        // FIX: use the backend's isAbuseCase flag (school_emotional_abuse OR
        // emoAbuseDetected OR home_abuse) instead of re-deriving it loosely
        // from category text - matches which entries actually have their
        // message text decrypted server-side.
        const isAbuse = entry.isAbuseCase === true || category === "emotional_abuse";
        const cleanPhoneWA = getCleanPhoneForWhatsApp(phone);

        return (
          <div key={entry._id} style={{ background: "rgba(18,18,20,0.95)", border: isAbuse ? "2px solid #fb923c" : "2px solid #ef4444", borderRadius: 12, padding: 16, marginTop: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: 16 }}>{name} {age ? `(${age}y)` : ""}</b>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: isAbuse ? "#fff7ed" : "#fee2e2", color: isAbuse ? "#ea580c" : "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: "bold" }}>{isAbuse ? "ABUSE" : category.toUpperCase()}</span>
                <span style={{ background: riskLevel === "RED" ? "#fee2e2" : "#fef3c7", color: riskLevel === "RED" ? "#dc2626" : "#d97706", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>{riskLevel} - {level}%</span>
              </div>
            </div>
            
            <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              📧 {email} | 🕒 {date} {countryCode ? `| 🌍 ${countryCode}` : ""} | Cat: {category}
            </div>

            <div style={{ marginTop: 10, fontSize: 14, background: "#141416", padding: 10, borderRadius: 8, border: "0.5px solid rgba(212,197,160,0.12)" }}>
              {textHidden ? (
                <div style={{ color: "#888", fontStyle: "italic" }}>🔒 Message content stays private for non-abuse alerts - user info shown so you can check in if needed, but the actual message isn't casually readable here.</div>
              ) : (
                <div><b>Message:</b> "{text}"</div>
              )}
              <div style={{ marginTop: 4 }}><b>Triggers:</b> {triggers}</div>
              <div style={{ marginTop: 4 }}><b>Emergency Contact:</b> {emergencyName} - <b>{phone}</b></div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {phone ? (
                <>
                  <a href={"tel:" + phone}>
                    <button style={{ background: "#dc2626", color: "white", padding: "10px 16px", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>
                      📞 Call SOS: {phone}
                    </button>
                  </a>
                  <a href={`https://wa.me/${cleanPhoneWA}`} target="_blank" rel="noreferrer">
                    <button style={{ background: "#16a34a", color: "white", padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
                      💬 WhatsApp
                    </button>
                  </a>
                </>
              ) : (
                <span style={{ background: "#fef2f2", color: "#dc2626", padding: "10px", borderRadius: 8, fontSize: 13 }}>⚠ No emergency phone - user registered before fix</span>
              )}
              <button onClick={() => navigator.clipboard.writeText(textHidden ? `User: ${name} (${email})\nPhone: ${phone}` : `User: ${name} (${email})\nMessage: ${text}\nPhone: ${phone}`)} style={{ background: "#1f2937", color: "white", padding: "10px 12px", border: "none", borderRadius: 8, cursor: "pointer" }}>📋 Copy</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}