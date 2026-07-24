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

  if (loading) return <div style={{ padding: 40 }}>Loading RED alerts...</div>;
  if (error) return <div style={{ padding: 40 }}><h2 style={{ color: "red" }}>{error}</h2><button onClick={() => { localStorage.clear(); window.location.href = "/app"; }}>Logout & Login Again</button></div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
      <h1>Admin - RED CODE ({reds.length})</h1>
      <p style={{ color: "#666" }}>Call button only here with SOS data</p>

      {reds.length === 0 && <div style={{ background: "white", padding: 30, borderRadius: 12, marginTop: 20, textAlign: "center" }}>No RED alerts yet. Type "i want to kill myself" in main app to test.</div>}

      {reds.map((entry) => {
        const name = entry.userId?.name || "Unknown";
        const email = entry.userId?.email || entry.email || "";
        const phone = entry.userId?.emergencyPhone || entry.emergencyPhone || "";
        const text = entry.text || entry.message || "";
        const triggers = entry.triggers ? entry.triggers.join(", ") : "self-harm";
        const level = entry.level || 98;
        const date = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "";

        return (
          <div key={entry._id} style={{ background: "white", border: "2px solid #ef4444", borderRadius: 12, padding: 16, marginTop: 15 }}>
            <b>{name}</b>
            <div style={{ fontSize: 13, color: "#555" }}>{email} | {date}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <div><b>Message:</b> {text}</div>
              <div><b>Triggers:</b> {triggers}</div>
              <div><b>Level:</b> RED - {level}%</div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <a href={"tel:" + phone}>
                <button style={{ background: "#dc2626", color: "white", padding: "10px 16px", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>
                  Call SOS: {phone || "No Number"}
                </button>
              </a>
              <a href={"https://wa.me/" + phone} target="_blank" rel="noreferrer">
                <button style={{ background: "#16a34a", color: "white", padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  WhatsApp
                </button>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}