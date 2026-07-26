import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [reds, setReds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const res = await axios.get("https://emovra.onrender.com/api/admin/reds", {
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

  // Helper: Clean phone for WhatsApp link (needs digits only, no +, spaces)
  const getCleanPhoneForWhatsApp = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, ''); // +91 9876543210 -> 919876543210
  };

  if (loading) return <div style={{ padding: 40 }}>Loading RED alerts...</div>;
  if (error) return <div style={{ padding: 40 }}><h2 style={{ color: "red" }}>{error}</h2><button onClick={() => { localStorage.clear(); window.location.href = "/app"; }}>Logout & Login Again</button></div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
      <h1>Admin - RED CODE ({reds.length})</h1>
      <p style={{ color: "#666" }}>Only RED emergencies - International support enabled</p>

      {reds.length === 0 && <div style={{ background: "white", padding: 30, borderRadius: 12, marginTop: 20, textAlign: "center" }}>No RED alerts yet. Type "i want to kill myself" in main app to test.</div>}

      {reds.map((entry) => {
        // Support both entry.userId and entry.user (depends on your backend populate)
        const userData = entry.userId || entry.user || {};
        const name = userData.name || entry.name || "Unknown";
        const email = userData.email || entry.email || "No email";
        const phone = userData.emergencyPhone || entry.emergencyPhone || entry.phone || "";
        const emergencyName = userData.emergencyName || entry.emergencyName || "Emergency Contact";
        const countryCode = userData.countryCode || "";
        const text = entry.text || entry.message || "";
        const triggers = entry.triggers ? entry.triggers.join(", ") : entry.emotion || "self-harm";
        const level = entry.score || entry.level || 98;
        const date = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "";
        const age = userData.age || entry.age || "";

        const cleanPhoneWA = getCleanPhoneForWhatsApp(phone);

        return (
          <div key={entry._id} style={{ background: "white", border: "2px solid #ef4444", borderRadius: 12, padding: 16, marginTop: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: 16 }}>{name} {age ? `(${age}y)` : ""}</b>
              <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>RED - {level}%</span>
            </div>
            
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
              📧 {email} | 🕒 {date} {countryCode ? `| 🌍 ${countryCode}` : ""}
            </div>

            <div style={{ marginTop: 10, fontSize: 14, background: "#f9fafb", padding: 10, borderRadius: 8 }}>
              <div><b>Message:</b> "{text}"</div>
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
                <span style={{ background: "#fef2f2", color: "#dc2626", padding: "10px", borderRadius: 8, fontSize: 13 }}>⚠️ No emergency phone - user registered before fix</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}