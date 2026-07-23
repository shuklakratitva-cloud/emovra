import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Auth({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", password: "", emergencyPhone: "" });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.password) {
      return alert("Name, Age, Password required");
    }
    if (isSignup && !form.emergencyPhone) {
      return alert("Emergency Phone required");
    }

    setLoading(true);
    const cleanName = form.name.toLowerCase().replace(/\s/g, '');
    const fakeEmail = `${cleanName}${form.age}@mindguard.local`;

    const payload = isSignup
      ? { 
          name: form.name.trim(), 
          email: fakeEmail, 
          age: Number(form.age), 
          password: form.password, 
          emergencyPhone: form.emergencyPhone.trim() 
        }
      : { 
          email: fakeEmail, 
          password: form.password 
        };

    const url = isSignup ? `${API}/auth/signup` : `${API}/auth/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // This matches your App.jsx: setUser(u)
      if (onAuth) onAuth(data.user);
      else window.location.reload();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(1200px 600px at 50% -10%, #7c3aed 0%, #2a0845 40%, #0f0a1a 100%)",
      position: "relative", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Glow Orbs */}
      <div style={{ position: "absolute", width: 600, height: 600, background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", top: -100, left: "20%", filter: "blur(40px)", opacity: 0.8 }} />
      <div style={{ position: "absolute", width: 800, height: 800, background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", bottom: -200, right: "10%", filter: "blur(60px)" }} />

      <div style={{
        width: 420, padding: "32px 28px", borderRadius: 24,
        background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        position: "relative", zIndex: 2
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "#fff", fontWeight: 700, opacity: 0.9 }}>WEBFLOW TRICKS AND WIZARDRY</span>
        </div>

        <h1 style={{ color: "#fff", fontSize: 29, fontWeight: 800, margin: "0 0 6px", lineHeight:1.15 }}>{isSignup ? "Create Account" : "Welcome Back"}</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 22px" }}>{isSignup ? "Join MindGuard secure space" : "Log in to continue to your workspace"}</p>

        <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" required />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input style={inputStyle} type="number" min="10" max="100" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Enter your age" required />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          {isSignup && (
            <div>
              <label style={labelStyle}>Emergency Phone</label>
              <input style={inputStyle} value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="For SOS help" required />
            </div>
          )}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          {isSignup ? "Already have account?" : "No account?"} {" "}
          <span onClick={() => setIsSignup(!isSignup)} style={{ color: "#fff", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
            {isSignup ? "Sign In" : "Sign Up"}
          </span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>SECURE • FAST • MAGIC POWERED</div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 11, color: "rgba(255,255,255,0.88)", background: "rgba(255,255,255,0.16)",
  padding: "4px 9px", borderRadius: 7, marginBottom: 6, display: "inline-block", fontWeight: 600
};
const inputStyle = {
  width: "100%", padding: "12.5px 13px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.22)", color: "#fff", outline: "none", boxSizing: "border-box", fontSize: 14
};
const btnStyle = {
  marginTop: 6, width: "100%", padding: "13px", borderRadius: 13, border: "none",
  background: "linear-gradient(90deg, #6d28d9, #8b5cf6)", color: "#fff", fontWeight: 750, fontSize: 14.5, cursor: "pointer",
  boxShadow: "0 8px 20px rgba(124,58,237,0.45)"
};