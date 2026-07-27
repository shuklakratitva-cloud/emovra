import { useState } from 'react';
const API = "https://emovra.onrender.com/api";

export default function PhoneVerify({ onVerified }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");

  const sendOtp = async () => {
    setMsg("Sending...");
    const res = await fetch(`${API}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (data.success) { setStep(2); setMsg("OTP sent! Check Render logs for now."); }
    else setMsg(data.error);
  };

  const verifyOtp = async () => {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    if (data.verified) { setMsg("Verified!"); onVerified(phone); }
    else setMsg("Wrong OTP");
  };

  return (
    <div style={{background:'#141416', padding:'24px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
      <h3>Breathe. Balance. Become. - Verify Phone</h3>
      {step === 1 ? (
        <>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98XXXXXXXX" style={{width:'100%', padding:'12px', margin:'10px 0'}} />
          <button onClick={sendOtp} style={{background:'#E7D3A3', padding:'12px', width:'100%'}}>Send OTP</button>
        </>
      ) : (
        <>
          <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="6-digit OTP" style={{width:'100%', padding:'12px', margin:'10px 0'}} />
          <button onClick={verifyOtp} style={{background:'#E7D3A3', padding:'12px', width:'100%'}}>Verify & Continue</button>
        </>
      )}
      <p>{msg}</p>
    </div>
  )
}