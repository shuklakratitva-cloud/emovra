import { useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Auth({ onAuth, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name:"", age:"", password:"", emergencyPhone:"" });
  const [loading, setLoading] = useState(false);

  const finish = (u,t) => {
    localStorage.setItem("token",t); localStorage.setItem("user",JSON.stringify(u));
    if(onAuth) onAuth(u); if(onLogin) onLogin(u);
  };

  const handle = async (e) => {
    e.preventDefault();
    if(!form.name||!form.age||!form.password) return alert("Name, Age, Password required");
    if(isSignup &&!form.emergencyPhone) return alert("Emergency Phone required");
    setLoading(true);
    const clean = form.name.toLowerCase().replace(/\s/g,'');
    const fakeEmail = `${clean}${form.age}@mindguard.local`;
    const payload = isSignup? {name:form.name.trim(),email:fakeEmail,age:Number(form.age),password:form.password,emergencyPhone:form.emergencyPhone.trim()} : {email:fakeEmail,password:form.password};
    try{
      const r=await fetch(`${API}/auth/${isSignup?"signup":"login"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json(); if(!r.ok) throw new Error(d.msg||"Failed");
      finish(d.user,d.token);
    }catch(err){ alert(err.message) } finally{ setLoading(false) }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(1200px 600px at 50% -10%, #7c3aed 0%, #2a0845 40%, #0f0a1a 100%)",position:"relative",overflow:"hidden",fontFamily:"Inter,sans-serif",padding:20}}>
      <div style={{position:"absolute",width:600,height:600,background:"radial-gradient(circle,#a855f7 0%,transparent 70%)",top:-100,left:"20%",filter:"blur(40px)",opacity:0.8}}/>
      <div style={{width:420,padding:"32px 28px",borderRadius:24,background:"#1b1032",border:"1px solid rgba(168,85,247,0.35)",boxShadow:"0 20px 60px rgba(0,0,0,0.6)",position:"relative",zIndex:2}}>
        <div style={{color:"#d8b4fe",fontSize:10,letterSpacing:"0.22em",fontWeight:800,marginBottom:18}}>✨ WEBFLOW TRICKS AND WIZARDRY</div>
        <h1 style={{color:"#fff",fontSize:28,fontWeight:800,margin:"0 0 6px"}}>{isSignup?"Create Account":"Welcome Back"}</h1>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:"0 0 20px"}}>{isSignup?"Join MindGuard secure space":"Log in to continue"}</p>
        <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:12}}>
          <label style={L}>Name</label><input style={I} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter your full name" required/>
          <label style={L}>Age</label><input style={I} type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="Enter your age" required/>
          <label style={L}>Password</label><input style={I} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
          {isSignup && <><label style={L}>Emergency Phone</label><input style={I} value={form.emergencyPhone} onChange={e=>setForm({...form,emergencyPhone:e.target.value})} placeholder="For SOS help" required/></>}
          <button disabled={loading} style={B}>{loading?"Please wait...":isSignup?"Sign Up":"Sign In"}</button>
        </form>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"#9ca3af"}}>{isSignup?"Already have?":"No account?"} <span onClick={()=>setIsSignup(!isSignup)} style={{color:"#fff",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>{isSignup?"Sign In":"Sign Up"}</span></div>
      </div>
    </div>
  );
}
const L={fontSize:11,color:"#e9d5ff",background:"rgba(255,255,255,0.12)",padding:"3px 8px",borderRadius:6,display:"inline-block",fontWeight:600};
const I={width:"100%",padding:"12px 13px",borderRadius:11,border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.07)",color:"#fff",outline:"none",fontSize:14,boxSizing:"border-box"};
const B={marginTop:8,width:"100%",padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(90deg,#6d28d9,#8b5cf6)",color:"#fff",fontWeight:800,cursor:"pointer"};