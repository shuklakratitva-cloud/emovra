import { useEffect, useState } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";
import PhoneVerify from "../components/PhoneVerify"; // <-- make sure this file exists

const ZEN_IMAGE = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop";
const EMOVRA_LOGO = "/emovra-logo.png";

export default function LandingPage() {
  const [showVerify, setShowVerify] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    localStorage.getItem('phoneVerified') === 'true'
  );

  const goApp = () => {
    if (!isPhoneVerified) {
      setShowVerify(true);
    } else {
      window.location.href = "/app";
    }
  };

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 75, behavior: 'smooth' });
  };

  useEffect(() => {
    document.body.style.background = "#09090b";
  }, []);

  const handleVerified = (phone) => {
    localStorage.setItem('phoneVerified', 'true');
    localStorage.setItem('userPhone', phone);
    setIsPhoneVerified(true);
    setShowVerify(false);
    window.location.href = "/app";
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0c', color:'#e8dcc6', fontFamily:'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap');
        .serif{font-family:'Instrument Serif',serif}
        .tracking-mini{letter-spacing:0.18em;text-transform:uppercase;font-size:9px}
        html{scroll-behavior:smooth}
      `}</style>

      {/* HEADER - WITH OPTION 2 */}
      <header style={{ height:72, borderBottom:'0.5px solid rgba(212,197,160,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, background:'rgba(10,10,12,0.92)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={goTop}>
          <img src={EMOVRA_LOGO} alt="EMOVRA" style={{ height:52, width:'auto', objectFit:'contain' }} />
          {/* OPTION 2 TAGLINE */}
          <div style={{ display:'flex', alignItems:'center', marginLeft:4 }}>
            <div style={{ width:1, height:18, background:'rgba(212,197,160,0.2)', marginRight:14 }}></div>
            <span style={{ fontSize:9, letterSpacing:'0.24em', color:'rgba(232,220,198,0.5)', textTransform:'uppercase', whiteSpace:'nowrap' }}>Breathe. Balance. Become.</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:28, fontSize:13, color:'rgba(232,220,198,0.6)' }}>
          <span onClick={goTop} style={{ color:'#d4c5a0', borderBottom:'1px solid #d4c5a0', cursor:'pointer' }}>Home</span>
          <span onClick={()=>scrollTo('about')} style={{cursor:'pointer'}}>About</span>
          <span onClick={()=>scrollTo('features')} style={{cursor:'pointer'}}>Features</span>
          <span onClick={()=>scrollTo('science')} style={{cursor:'pointer'}}>Science</span>
          <span onClick={()=>scrollTo('journal')} style={{cursor:'pointer'}}>Journal</span>
          <span onClick={()=>scrollTo('support')} style={{cursor:'pointer'}}>Contact</span>
        </div>
        <button onClick={goApp} style={{ border:'0.5px solid rgba(212,197,160,0.4)', background:'transparent', color:'#d4c5a0', padding:'8px 20px', borderRadius:999, fontSize:12, cursor:'pointer' }}>Get Started</button>
      </header>

      {/* OTP MODAL */}
      {showVerify && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ position:'relative', width:'100%', maxWidth:400 }}>
            <button onClick={()=>setShowVerify(false)} style={{ position:'absolute', top:-40, right:0, background:'transparent', border:0, color:'white', cursor:'pointer' }}>✕ Close</button>
            <PhoneVerify onVerified={handleVerified} />
          </div>
        </div>
      )}

      {/* HERO - UNCHANGED - your code continues... */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'50px 32px', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:50, alignItems:'center' }}>
        <div>
          <h1 className="serif" style={{ fontSize:'54px', lineHeight:1.05, fontWeight:400, color:'#e8dcc6', margin:0 }}>Your Mental Wellness<br/>Understood</h1>
          <p style={{ marginTop:20, color:'rgba(232,220,198,0.65)', fontSize:13.5, lineHeight:1.6, maxWidth:480, fontWeight:300 }}>
            Evidence-based mindfulness and mental resilience, designed for calm. Private, secure, and scientifically guided to help you find clarity, balance, and peace each day.
          </p>
          <div style={{ marginTop:28, display:'flex', gap:14 }}>
            <button onClick={goApp} style={{ background:'#d4b07a', color:'#000', border:0, padding:'12px 28px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>Begin Your Journey</button>
            <button onClick={()=>scrollTo('features')} style={{ background:'transparent', border:'0.5px solid rgba(212,197,160,0.3)', color:'#d4c5a0', padding:'12px 28px', borderRadius:8, fontSize:12, cursor:'pointer' }}>Learn More →</button>
          </div>
          {/* ... rest of your sections ... */}
        </div>
        <div style={{ background:'rgba(15,15,17,0.6)', border:'0.5px solid rgba(212,197,160,0.25)', borderRadius:16, padding:16, height:460 }}>
          <div style={{ borderRadius:12, overflow:'hidden', height:260 }}><img src={ZEN_IMAGE} alt="zen" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>
          <div style={{ textAlign:'center', marginTop:20 }}>
            <div className="tracking-mini" style={{ color:'#d4c5a0' }}>Daily Calm • Guided 10-Min Session</div>
            <div style={{ marginTop:22, fontSize:11, color:'rgba(255,255,255,0.4)' }}>Breathing Focus • Session 03</div>
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}><div style={{ flex:1, height:1, background:'rgba(212,197,160,0.15)' }}><div style={{ width:'60%', height:'100%', background:'#d4c5a0' }}></div></div><div style={{ fontSize:10, color:'#d4c5a0' }}>∿∿∿</div></div>
            <button onClick={goApp} style={{ marginTop:18, background:'transparent', border:0, color:'#d4c5a0', fontSize:12, cursor:'pointer' }}>Start Session →</button>
          </div>
        </div>
      </div>

      {/* Keep your features, science, journal, about, support sections exactly as they were */}
      {/* ... paste your remaining sections here ... */}

      <LegalCookieBanner />
    </div>
  );
}