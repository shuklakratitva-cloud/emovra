import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isValidPhoneNumber } from "libphonenumber-js";
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

// NEW: Google Sign-In. This value is NOT secret (client IDs are meant to
// be public, unlike API keys) - paste your real one here once you've
// created it. Get one free at:
// https://console.cloud.google.com/apis/credentials -> "Create Credentials"
// -> "OAuth client ID" -> type "Web application" -> add your site's URL
// (e.g. https://emovra.pages.dev) under "Authorized JavaScript origins".
// No billing/payment step involved - this is a different, free part of
// Google Cloud Console from the Gemini API billing screen.
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com";

export default function Auth({ onAuth }) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", age: "", password: "",
    emergencyName: "", countryCode: "+91", emergencyPhone: ""
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value });

  // --- Forgot password via EMAIL OTP (was phone - phone OTP never sent
  // real SMS, so it's been replaced with real email delivery) ---
  const [forgotMode, setForgotMode] = useState(null); // null | "request" | "reset"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  // --- NEW: Google Sign-In ---
  const googleBtnRef = useRef(null);
  const [googleCredential, setGoogleCredential] = useState(null); // held onto in case we need to complete signup
  const [needsGoogleSignup, setNeedsGoogleSignup] = useState(null); // {email, name} when Google account has no matching Emovra account yet
  const [googleExtra, setGoogleExtra] = useState({ age: "", emergencyName: "", emergencyPhone: "", countryCode: "+91" });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  async function completeGoogleAuth(credential, extra = {}) {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      const consent = getConsent();
      const res = await axios.post(`${BASE_URL}/google`, {
        credential,
        ...extra,
        legalConsent: extra.age ? { given: true, type: consent.type || "all", consentText: consent.consentText } : undefined,
      });

      if (res.data.needsSignup) {
        setGoogleCredential(credential);
        setNeedsGoogleSignup({ email: res.data.googleEmail, name: res.data.googleName });
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onAuth(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setGoogleError(err.response?.data?.msg || "Google Sign-In failed. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleCompleteGoogleSignup(e) {
    e.preventDefault();
    const digits = googleExtra.emergencyPhone.replace(/\D/g, "");
    if (!googleExtra.emergencyName || googleExtra.emergencyName.trim().length < 2) {
      setGoogleError("Emergency contact name is compulsory!"); return;
    }
    if (digits.length < 7 || digits.length > 15 || !isValidPhoneNumber(`${googleExtra.countryCode}${digits}`)) {
      setGoogleError("That doesn't look like a valid phone number for the selected country - please double check it."); return;
    }
    if (!googleExtra.age) {
      setGoogleError("Age is required."); return;
    }
    completeGoogleAuth(googleCredential, {
      age: Number(googleExtra.age),
      emergencyName: googleExtra.emergencyName.trim(),
      emergencyPhone: digits,
      countryCode: googleExtra.countryCode,
    });
  }

  // Loads Google's Identity Services script once and renders the button.
  // Silently does nothing if GOOGLE_CLIENT_ID hasn't been filled in yet,
  // rather than showing a broken button.
  useEffect(() => {
    if (GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID_HERE")) return; // not configured yet
    if (needsGoogleSignup) return; // don't render the button on the "complete your profile" screen

    const existing = document.getElementById("google-identity-script");
    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => completeGoogleAuth(response.credential),
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline", size: "large", width: 320, text: isSignup ? "signup_with" : "signin_with",
        });
      }
    }

    if (existing) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-identity-script";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [isSignup, needsGoogleSignup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup) {
      if (!form.emergencyName || form.emergencyName.trim().length < 2) {
        alert("Emergency contact name is compulsory!"); return;
      }
      const digitsOnly = form.emergencyPhone.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15 || !isValidPhoneNumber(`${form.countryCode}${digitsOnly}`)) {
        alert("That doesn't look like a valid phone number for the selected country - please double check it."); return;
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
      navigate("/dashboard");
    } catch (err) {
      console.log("Full error:", err.response?.data);
      alert(err.response?.data?.msg || err.message || "Server Error - wait 30s");
    } finally { setLoading(false); }
  };

  // --- Forgot-password handlers (now email-based) ---
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) { setForgotMsg("Enter a valid email address."); return; }
    setForgotLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/forgot-password/send`, { email: forgotEmail.trim().toLowerCase() });
      setForgotMsg(res.data.devMode ? `Email sending isn't set up yet - your code is ${res.data.otp}` : "If an account exists for that email, a code has been sent.");
      setForgotMode("reset");
    } catch (err) {
      setForgotMsg(err.response?.data?.msg || "Could not send code. Try again.");
    } finally { setForgotLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    if (!forgotOtp.trim()) { setForgotMsg("Enter the code you received."); return; }
    if (!newPassword || newPassword.length < 6) { setForgotMsg("New password must be at least 6 characters."); return; }
    setForgotLoading(true);
    try {
      await axios.post(`${BASE_URL}/forgot-password/reset`, { email: forgotEmail.trim().toLowerCase(), otp: forgotOtp.trim(), newPassword });
      setForgotMsg("Password reset. You can sign in now.");
      setTimeout(() => {
        setForgotMode(null);
        setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setForgotMsg("");
        setIsSignup(false);
      }, 1200);
    } catch (err) {
      setForgotMsg(err.response?.data?.msg || "Invalid or expired code.");
    } finally { setForgotLoading(false); }
  };

  const inputStyle = { padding: "10px", borderRadius: "8px", color: "black" };

  // --- Google Sign-In: "complete your profile" screen (shown when a
  // Google account has no matching Emovra account yet - collects the
  // extra required fields Google doesn't provide) ---
  if (needsGoogleSignup) {
    return (
      <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
        <h2>Almost there</h2>
        <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>
          Signed in as {needsGoogleSignup.name || needsGoogleSignup.email}. Just need a couple more things required for safety features like SOS.
        </p>
        <form onSubmit={handleCompleteGoogleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <input type="number" min="10" max="100" placeholder="Age *" value={googleExtra.age} onChange={(e) => setGoogleExtra({...googleExtra, age: e.target.value})} required style={inputStyle} />
          <input placeholder="Emergency Contact Name * (Mom/Dad)" value={googleExtra.emergencyName} onChange={(e) => setGoogleExtra({...googleExtra, emergencyName: e.target.value})} required style={inputStyle} />
          <div style={{ display: "flex", gap: "8px" }}>
            <select value={googleExtra.countryCode} onChange={(e) => setGoogleExtra({...googleExtra, countryCode: e.target.value})} style={{ width: "120px", padding: "10px", borderRadius: "8px", color: "black" }}>
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
            <input type="tel" placeholder="Emergency Phone *" value={googleExtra.emergencyPhone} onChange={(e) => setGoogleExtra({...googleExtra, emergencyPhone: e.target.value})} required style={{ flex: 1, padding: "10px", borderRadius: "8px", color: "black" }} />
          </div>
          {googleError && <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{googleError}</p>}
          <button type="submit" disabled={googleLoading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {googleLoading ? "Finishing up..." : "Finish signing up"}
          </button>
        </form>
        <p style={{ marginTop: "15px", textAlign: "center" }}>
          <span onClick={() => { setNeedsGoogleSignup(null); setGoogleCredential(null); setGoogleError(""); }} style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}>← Cancel</span>
        </p>
      </div>
    );
  }

  // --- Forgot-password screens ---
  if (forgotMode === "request") {
    return (
      <div style={{ maxWidth: "420px", margin: "50px auto", padding: "25px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
        <h2>Reset Password</h2>
        <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>
          Enter your account email. We'll send a one-time code to it.
        </p>
        <form onSubmit={handleSendResetOtp} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <input type="email" placeholder="Your account email *" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required style={inputStyle} />
          {forgotMsg && <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{forgotMsg}</p>}
          <button type="submit" disabled={forgotLoading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {forgotLoading ? "Sending code..." : "Send code"}
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
        <h2>Enter Code</h2>
        <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>
          Enter the code sent to {forgotEmail} and choose a new password.
        </p>
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
          <input type="text" inputMode="numeric" placeholder="6-digit code *" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="New password *" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
          {forgotMsg && <p style={{ fontSize: 12, color: forgotMsg.includes("reset") ? "#86efac" : "#fca5a5", margin: 0 }}>{forgotMsg}</p>}
          <button type="submit" disabled={forgotLoading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {forgotLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p style={{ marginTop: "15px", textAlign: "center", display: "flex", justifyContent: "space-between" }}>
          <span onClick={() => { setForgotMode("request"); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Resend code</span>
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

      {/* NEW: Google Sign-In button - renders itself once GOOGLE_CLIENT_ID is filled in */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
        <div ref={googleBtnRef} />
      </div>
      {googleLoading && <p style={{ fontSize: 12, textAlign: "center", color: "#a78bfa", marginTop: 8 }}>Signing in with Google...</p>}
      {googleError && <p style={{ fontSize: 12, textAlign: "center", color: "#fca5a5", marginTop: 8 }}>{googleError}</p>}

      {!isSignup && (
        <p style={{ marginTop: "10px", textAlign: "center" }}>
          <span onClick={() => { setForgotMode("request"); setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setForgotMsg(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
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
