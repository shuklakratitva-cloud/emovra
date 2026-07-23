import { useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Auth({ onAuth, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name:"", age:"", password:"", emergencyPhone:"" });
  const [loading, setLoading] = useState(false);

  const finish = (u,t)=>{ localStorage.setItem("token",t); localStorage.setItem("user",JSON.stringify(u)); if(onAuth) onAuth(u); if(onLogin) onLogin(u); };

  const handle = async(e)=>{
    e.preventDefault();
    if(!form.name||!form.age||!form.password) return alert("Name, Age, Password required");
    if(isSignup&&!form.emergencyPhone) return alert("Emergency Phone required");
    setLoading(true);
    const email=`${form.name.toLowerCase().replace(/\s/g,'')}${form.age}@mindguard.local`;
    const body=isSignup?{name:form.name.trim(),email,age:Number(form.age),password:form.password,emergencyPhone:form.emergencyPhone.trim()}:{email,password:form.password};
    try{
      const r=await fetch(`${API}/auth/${isSignup?"signup":"login"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json(); if(!r.ok) throw new Error(d.msg); finish(d.user,d.token);
    }catch(err){ alert(err.message) } finally{ setLoading(false) }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(900px 600px at 50% 0%, #7c3aed 0%, #3b1a7a 40%, #0f011a 100%)",padding:20}}>
      <div className="auth-card" id="auth-card-fix" style={{width:"100%",maxWidth:400,padding:"28px 24px",borderRadius:20,background:"#1a1033",border:"1px solid #4c1d95",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
        <div style={{color:"#c4b5fd",fontSize:10,letterSpacing:"0.2em",fontWeight:800,marginBottom:14}}>✨ WEBFLOW TRICKS AND WIZARDRY</div>
        <h1 style={{color:"#fff",fontSize:26,fontWeight:900,margin:"0 0 6px"}}>{isSignup?"Create Account":"Welcome Back"}</h1>
        <p style={{color:"#a78bfa",fontSize:13,margin:"0 0 18px"}}>{isSignup?"Join MindGuard":"Log in to continue"}</p>

        <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:12}}>
          <label style={{fontSize:11,color:"#e9d5ff"}}>Name</label>
          <input id="name" name="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter your full name" required
            style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #5b21b6",background:"#2a1c4f",color:"#fff",outline:"none"}}/>
          
          <label style={{fontSize:11,color:"#e9d5ff"}}>Age</label>
          <input id="age" name="age" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="Enter your age" required
            style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #5b21b6",background:"#2a1c4f",color:"#fff"}}/>
          
          <label style={{fontSize:11,color:"#e9d5ff"}}>Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required
            style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #5b21b6",background:"#2a1c4f",color:"#fff"}}/>

          {isSignup && <>
            <label style={{fontSize:11,color:"#e9d5ff"}}>Emergency Phone</label>
            <input id="emergencyPhone" name="emergencyPhone" value={form.emergencyPhone} onChange={e=>setForm({...form,emergencyPhone:e.target.value})} placeholder="For SOS help" required
              style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #5b21b6",background:"#2a1c4f",color:"#fff"}}/>
          </>}

          <button className="auth-btn no-gradient" type="submit" disabled={loading} style={{marginTop:8,width:"100%",padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(90deg,#7c3aed,#a855f7)",color:"#fff",fontWeight:800,cursor:"pointer"}}>{loading?"Wait...":isSignup?"Sign Up":"Sign In"}</button>
        </form>

        <div style={{textAlign:"center",marginTop:14,fontSize:13,color:"#a78bfa"}}>{isSignup?"Already have?":"No account?"} <span onClick={()=>setIsSignup(!isSignup)} style={{color:"#fff",fontWeight:800,cursor:"pointer",textDecoration:"underline"}}>{isSignup?"Sign In":"Sign Up"}</span></div>
      </div>
    </div>
  );
}