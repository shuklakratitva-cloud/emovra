import { useState } from "react";
import axios from "axios";

export default function Auth({ onAuth }) {
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    emergencyPhone: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isSignup 
        ? "https://emovra.onrender.com/api/auth/register"
        : "https://emovra.onrender.com/api/auth/login";
      
      const payload = isSignup ? form : { email: form.email, password: form.password };
      
      const res = await axios.post(url, payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onAuth(res.data.user);
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", background: "var(--card-bg, #1e1e2f)", borderRadius: "12px", color: "white" }}>
      <h2>{isSignup ? "Create Account" : "Sign In"} - MindGuard</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        {isSignup && (
          <input name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px" }} />
        )}
        
        <input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px" }} />
        
        {isSignup && (
          <>
            <input name="age" type="number" placeholder="Enter your age" value={form.age} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px" }} />
            <input name="emergencyPhone" placeholder="For SOS help" value={form.emergencyPhone} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px" }} />
          </>
        )}
        
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ padding: "10px", borderRadius: "8px" }} />
        
        <button type="submit" disabled={loading} style={{ padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          {loading ? "Loading..." : isSignup ? "Sign Up" : "Sign In"}
        </button>
      </form>
      
      <p style={{ marginTop: "15px", textAlign: "center" }}>
        {isSignup ? "Already have?" : "Don't have account?"}{" "}
        <span onClick={() => setIsSignup(!isSignup)} style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}>
          {isSignup ? "Sign In" : "Sign Up"}
        </span>
      </p>
    </div>
  );
}