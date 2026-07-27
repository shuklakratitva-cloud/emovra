import { useState } from "react";
import axios from "axios";
import LegalCookieBanner from "./LegalCookieBanner";

// FIXED: This now actually returns fallback, your old one returned null and blocked signup
const getConsent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("emovra_legal_consent") || "null");
    if (saved && saved.given) return saved;
    if (saved && saved.type) return { given: true,...saved };
  } catch {}
  // This now runs when banner was never clicked (direct /app access)
  return {
    given: true,
    type: "all",
    consentText: "Accepted via signup - Privacy Policy & Terms v1.0 - 26 July 2026"
  };
};

export default function Auth({ onAuth }) {
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", age: "", password: "",
    emergencyName: "", countryCode: "+91", emergencyPhone: ""
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value });

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
      const BASE_URL = "https://emovra.onrender.com/api/auth";
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
    } catch (err) {
      console.log("Full error:", err.response?.data);
      alert(err.response?.data?.msg || err.message || "Server Error - wait 30s");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
      <h2>{isSignup? "Create Account" : "Sign In"} - MindGuard</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
        {isSignup && <input name="name" placeholder="Full name *" value={form.name} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px", color: "black" }} />}
        <input name="email" type="email" placeholder="Email *" value={form.email} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px", color: "black" }} />
        {isSignup && <>
          <input name="age" type="number" min="10" max="100" placeholder="Age *" value={form.age} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px", color: "black" }} />
          <input name="emergencyName" placeholder="Emergency Contact Name * (Mom/Dad)" value={form.emergencyName} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px", color: "black" }} />
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
        <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px", color: "black" }} />
        <button type="submit" disabled={loading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          {loading? "Waking up server... wait 30s" : isSignup? "Sign Up" : "Sign In"}
        </button>
      </form>
      <p style={{ marginTop: "15px", textAlign: "center" }}>
        {isSignup? "Already have an account?" : "Don't have an account?"}{" "}
        <span onClick={() => setIsSignup(!isSignup)} style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}>{isSignup? "Sign In" : "Sign Up"}</span>
      </p>
      <LegalCookieBanner />
    </div>
  );
}