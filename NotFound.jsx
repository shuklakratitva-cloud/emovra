import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#e8dcc6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🦋</div>
      <h1 style={{ fontSize: 32, color: "#d4b07a", margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: 14, color: "#e8dcc6cc", marginTop: 10, maxWidth: 420 }}>
        This page doesn't exist, or the link may be out of date. Nothing to worry about - let's get you back.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={() => navigate("/")} style={{ background: "#d4b07a", color: "#000", border: "none", padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Go to homepage
        </button>
        <button onClick={() => navigate("/app")} style={{ background: "transparent", border: "1px solid rgba(212,197,160,0.3)", color: "#e8dcc6", padding: "12px 24px", borderRadius: 999, fontSize: 13, cursor: "pointer" }}>
          Open Emovra
        </button>
      </div>
      <div style={{ marginTop: 40, fontSize: 12, color: "#e8dcc699", borderTop: "0.5px solid rgba(212,197,160,0.15)", paddingTop: 20, maxWidth: 420 }}>
        If you need to talk to someone right now: Tele-MANAS <b>14416</b> · Kiran <b>1800-599-0019</b> · AASRA <b>1800-233-3330</b>
      </div>
    </div>
  );
}
