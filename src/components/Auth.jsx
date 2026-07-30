import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LegalCookieBanner from "./LegalCookieBanner";

const getConsent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("emovra_legal_consent") || "null");
    if (saved && saved.given) return saved;
    if (saved && saved.type) return { given: true,...saved };
  } catch {}
  return {
    given: true,
    type: "all",
    consentText: "Accepted via signup - Privacy Policy & Terms v1.0 - 26 July 2026"
  };
};

const BASE_URL = "https://emovra.onrender.com/api/auth";

export default function Auth({ onAuth }) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", age: "", password: "",
    emergencyName: "", countryCode: "+91", emergencyPhone: ""
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value });

  // --- NEW: Forgot password via OTP ---
  // mode: null (normal auth) | "request" (enter phone) | "reset" (enter OTP + new password)
  const [forgotMode, setForgotMode] = useState(null);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup) {
      if (!form.emergencyName || form.emergencyName.trim().length < 2) {
        alert("Emergency contact name is compulsory!"); return;
      }
      const digitsOnly = form.emergencyPhone.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        alert("Please enter a valid emergency phone number (7-15 digits)"); return;
      }
    }
    setLoading(true);
    try {
      const url = isSignup? `${BASE_URL}/signup` : `${BASE_URL}/login`;
      const consent = getConsent();

      const payload = isSignup? {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        age: Number(form.age),
        password: form.password,
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.replace(/\D/g,""),
        countryCode: form.countryCode,
        legalConsent: { given: true, type: consent.type || "all", consentText: consent.consentText }
      } : {
        email: form.email.trim().toLowerCase(),
        password: form.password
      };

      const res = await axios.post(url, payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onAuth(res.data.user);
      // NEW: land on the personalized dashboard first, not straight into the app
      navigate("/dashboard");
    } catch (err) {
      console.log("Full error:", err.response?.data);
      alert(err.response?.data?.msg || err.message || "Server Error - wait 30s");
    } finally { setLoading(false); }
  };

  // --- NEW: forgot-password handlers ---
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    const digits = forgotPhone.replace(/\D/g, "");
    if (digits.length < 7) { setForgotMsg("Enter a valid phone number."); return; }
    setForgotLoading(true);
    try {
      await axios.post(`${BASE_URL}/forgot-password/send`, { phone: digits });
      setForgotMsg("OTP sent to your registered number.");
      setForgotMode("reset");
    } catch (err) {
      setForgotMsg(err.response?.data?.msg || "Could not send OTP. Check the number and try again.");
    } finally { setForgotLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    if (!forgotOtp.trim()) { setForgotMsg("Enter the OTP you received."); return; }
    if (!newPassword || newPassword.length < 6) { setForgotMsg("New password must be at least 6 characters."); return; }
    setForgotLoading(true);
    try {
      const digits = forgotPhone.replace(/\D/g, "");
      await axios.post(`${BASE_URL}/forgot-password/reset`, { phone: digits, otp: forgotOtp.trim(), newPassword });
      setForgotMsg("Password reset. You can sign in now.");
      setTimeout(() => {
        setForgotMode(null);
        setForgotPhone(""); setForgotOtp(""); setNewPassword(""); setForgotMsg("");
        setIsSignup(false);
      }, 1200);
    } catch (err) {
      setForgotMsg(err.response?.data?.msg || "Invalid or expired OTP.");
    } finally { setForgotLoading(false); }
  };

  const inputStyle = { padding: "10px", borderRadius: "8px", color: "black" };

  // --- NEW: forgot-password screens (same card shell/styling as the normal form) ---
  if (forgotMode === "request") {
    return (
      <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
        <h2>Reset Password</h2>
        <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>
          Enter the emergency contact phone number you signed up with. We'll send a one-time code to it.
        </p>
        <form onSubmit={handleSendResetOtp} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <input type="tel" placeholder="Registered phone number *" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} required style={inputStyle} />
          {forgotMsg && <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{forgotMsg}</p>}
          <button type="submit" disabled={forgotLoading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {forgotLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
        <p style={{ marginTop: "15px", textAlign: "center" }}>
          <span onClick={() => { setForgotMode(null); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}>← Back to sign in</span>
        </p>
      </div>
    );
  }

  if (forgotMode === "reset") {
    return (
      <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
        <h2>Enter OTP</h2>
        <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>
          Enter the code sent to {forgotPhone} and choose a new password.
        </p>
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <input type="text" inputMode="numeric" placeholder="6-digit OTP *" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="New password *" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
          {forgotMsg && <p style={{ fontSize: 12, color: forgotMsg.includes("reset") ? "#86efac" : "#fca5a5", margin: 0 }}>{forgotMsg}</p>}
          <button type="submit" disabled={forgotLoading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {forgotLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p style={{ marginTop: "15px", textAlign: "center", display: "flex", justifyContent: "space-between" }}>
          <span onClick={() => { setForgotMode("request"); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Resend OTP</span>
          <span onClick={() => { setForgotMode(null); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Back to sign in</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
      <h2>{isSignup? "Create Account" : "Sign In"} - MindGuard</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
        {isSignup && <input name="name" placeholder="Full name *" value={form.name} onChange={handleChange} required style={inputStyle} />}
        <input name="email" type="email" placeholder="Email *" value={form.email} onChange={handleChange} required style={inputStyle} />
        {isSignup && <>
          <input name="age" type="number" min="10" max="100" placeholder="Age *" value={form.age} onChange={handleChange} required style={inputStyle} />
          <input name="emergencyName" placeholder="Emergency Contact Name * (Mom/Dad)" value={form.emergencyName} onChange={handleChange} required style={inputStyle} />
          <div style={{ display: "flex", gap: "8px" }}>
            <select name="countryCode" value={form.countryCode} onChange={handleChange} style={{ width: "120px", padding: "10px", borderRadius: "8px", color: "black" }}>
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+971">🇦🇪 +971</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+81">🇯🇵 +81</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+86">🇨🇳 +86</option>
              <option value="+65">🇸🇬 +65</option>
            </select>
            <input name="emergencyPhone" type="tel" placeholder="Emergency Phone *" value={form.emergencyPhone} onChange={handleChange} required style={{ flex: 1, padding: "10px", borderRadius: "8px", color: "black" }} />
          </div>
          <small style={{ color: "#ff6b6b", fontSize: "11px" }}>* Compulsory - Used only in RED emergency for SOS</small>
        </>}
        <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} required style={inputStyle} />
        <button type="submit" disabled={loading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          {loading? "Waking up server... wait 30s" : isSignup? "Sign Up" : "Sign In"}
        </button>
      </form>

      {/* NEW: forgot password entry point - only shown on the sign-in screen */}
      {!isSignup && (
        <p style={{ marginTop: "10px", textAlign: "center" }}>
          <span onClick={() => { setForgotMode("request"); setForgotPhone(""); setForgotOtp(""); setNewPassword(""); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
            Forgot password?
          </span>
        </p>
      )}

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        {isSignup? "Already have an account?" : "Don't have an account?"}{" "}
        <span onClick={() => setIsSignup(!isSignup)} style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}>{isSignup? "Sign In" : "Sign Up"}</span>
      </p>
      <LegalCookieBanner />
    </div>
  );
}
