import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

export default function AdminPanel(){
  const [alerts,setAlerts] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    fetch(`${API}/alerts/all`, { 
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r=>r.json())
    .then(d=>{
      setAlerts(Array.isArray(d)?d:[]);
      setLoading(false);
    })
    .catch(()=>{
      setLoading(false);
    })
  },[])

  if(loading) return <div style={{padding:20}}>Loading RED alerts...</div>

  return (
    <div style={{maxWidth:900, margin:"20px auto", padding:16, fontFamily:"sans-serif"}}>
      <h2>👑 Admin - RED Alerts (Backend Only)</h2>
      <p style={{fontSize:12, opacity:0.6}}>SOS numbers are visible ONLY here, not in /app for normal users.</p>
      <a href="/app" style={{fontSize:13}}>← Back to App</a>
      {alerts.length===0 && <p style={{marginTop:20}}>No RED alerts yet.</p>}
      {alerts.map(a=>(
        <div key={a._id || a.id} style={{border:"1px solid #ef4444", padding:12, borderRadius:10, marginTop:10, background:"#fff"}}>
          <b>{a.userName || a.user?.name || "User"}</b> - {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
          <div style={{marginTop:6}}>Text: {a.text || a.message}</div>
          <div style={{marginTop:6, fontWeight:700, color:"red"}}>SOS: {a.sosPhone || a.emergencyPhone}</div>
        </div>
      ))}
    </div>
  )
}