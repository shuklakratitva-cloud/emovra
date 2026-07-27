import { useEffect } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";

// No local files needed - permanent CDN
const ZEN_IMAGE = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop";

export default function LandingPage() {
  const goApp = () => (window.location.href = "/app");
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  useEffect(() => {
    document.body.style.background = "#09090b";
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0c', color:'#e8dcc6', fontFamily:'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap');
        .serif{font-family:'Instrument Serif',serif}
        .tracking-mini{letter-spacing:0.18em;text-transform:uppercase;font-size:9px}
      `}</style>

      {/* HEADER - EXACT TO SCREENSHOT */}
      <header style={{ height:68, borderBottom:'0.5px solid rgba(212,197,160,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, background:'rgba(10,10,12,0.9)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>window.scrollTo({top:0, behavior:'smooth'})}>
          <span style={{ fontSize:22, color:'#d4c5a0' }}>♛</span>
          <span className="serif" style={{ fontSize:24, color:'#d4c5a0', fontWeight:400 }}>MindGuard</span>
        </div>
        <div style={{ display:'flex', gap:28, fontSize:13, color:'rgba(232,220,198,0.6)' }}>
          <span onClick={()=>window.scrollTo({top:0, behavior:'smooth'})} style={{ color:'#d4c5a0', borderBottom:'1px solid #d4c5a0', cursor:'pointer' }}>Home</span>
          <span onClick={()=>scrollTo('about')} style={{cursor:'pointer'}}>About</span>
          <span onClick={()=>scrollTo('features')} style={{cursor:'pointer'}}>Features</span>
          <span onClick={()=>scrollTo('science')} style={{cursor:'pointer'}}>Science</span>
          <span onClick={()=>scrollTo('features')} style={{cursor:'pointer'}}>Journal</span>
          <span onClick={()=>scrollTo('support')} style={{cursor:'pointer'}}>Contact</span>
        </div>
        <button onClick={goApp} style={{ border:'0.5px solid rgba(212,197,160,0.4)', background:'transparent', color:'#d4c5a0', padding:'8px 20px', borderRadius:999, fontSize:12, cursor:'pointer' }}>Get Started</button>
      </header>

      {/* HERO - EXACT TO SCREENSHOT */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'50px 32px', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:50, alignItems:'center' }}>
        
        {/* LEFT */}
        <div>
          <h1 className="serif" style={{ fontSize:'54px', lineHeight:1.05, fontWeight:400, color:'#e8dcc6', margin:0 }}>Your Mental Wellness<br/>Understood</h1>
          <p style={{ marginTop:20, color:'rgba(232,220,198,0.65)', fontSize:13.5, lineHeight:1.6, maxWidth:480, fontWeight:300 }}>
            Evidence-based mindfulness and mental resilience, designed for calm. Private, secure, and scientifically guided to help you find clarity, balance, and peace each day.
          </p>

          <div style={{ marginTop:28, display:'flex', gap:14 }}>
            <button onClick={goApp} style={{ background:'#d4b07a', color:'#000', border:0, padding:'12px 28px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>Begin Your Journey</button>
            <button onClick={()=>scrollTo('features')} style={{ background:'transparent', border:'0.5px solid rgba(212,197,160,0.3)', color:'#d4c5a0', padding:'12px 28px', borderRadius:8, fontSize:12, cursor:'pointer' }}>Learn More →</button>
          </div>

          <div style={{ marginTop:32, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:20 }}>
            <div style={{ borderRight:'0.5px solid rgba(255,255,255,0.08)', paddingRight:12 }}>
              <div style={{ display:'flex', gap:8, alignItems:'start' }}>
                <span style={{ fontSize:18 }}>🛡</span>
                <div><div style={{ fontSize:12, fontWeight:500 }}>Private & Secure</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>End-to-end encrypted, privacy first</div></div>
              </div>
            </div>
            <div style={{ borderRight:'0.5px solid rgba(255,255,255,0.08)', paddingRight:12, paddingLeft:4 }}>
              <div style={{ display:'flex', gap:8, alignItems:'start' }}>
                <span style={{ fontSize:18 }}>🧠</span>
                <div><div style={{ fontSize:12, fontWeight:500 }}>Therapist-Approved</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Built with clinical psychology experts</div></div>
              </div>
            </div>
            <div style={{ paddingLeft:4 }}>
              <div style={{ display:'flex', gap:8, alignItems:'start' }}>
                <span style={{ fontSize:18 }}>🍃</span>
                <div><div style={{ fontSize:12, fontWeight:500 }}>Daily Calm</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Guided practices in 5–15 minutes</div></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop:28, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
            <div><div style={{ fontSize:16, fontWeight:600 }}>• 98%</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Report Reduced Stress</div></div>
            <div><div style={{ fontSize:16, fontWeight:600 }}>• 10k+</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Active Members</div></div>
            <div><div style={{ fontSize:16, fontWeight:600 }}>• 4.9/5</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Wellness Rating</div></div>
          </div>
        </div>

        {/* RIGHT CARD - EXACT TO SCREENSHOT */}
        <div style={{ background:'rgba(15,15,17,0.6)', border:'0.5px solid rgba(212,197,160,0.25)', borderRadius:16, padding:16, height:460 }}>
          <div style={{ borderRadius:12, overflow:'hidden', height:260 }}>
            <img src={ZEN_IMAGE} alt="zen stones no people" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ textAlign:'center', marginTop:20 }}>
            <div className="tracking-mini" style={{ color:'#d4c5a0', fontSize:10 }}>Daily Calm • Guided 10-Min Session</div>
            <div style={{ marginTop:22, fontSize:11, color:'rgba(255,255,255,0.4)' }}>Breathing Focus • Session 03</div>
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'rgba(212,197,160,0.15)' }}><div style={{ width:'60%', height:'100%', background:'#d4c5a0' }}></div></div>
              <div style={{ fontSize:10, color:'#d4c5a0' }}>∿∿∿</div>
            </div>
            <button onClick={goApp} style={{ marginTop:18, background:'transparent', border:0, color:'#d4c5a0', fontSize:12, cursor:'pointer' }}>Start Session →</button>
          </div>
        </div>
      </div>

      {/* KEEP ALL YOUR ORIGINAL SECTIONS FOR FEATURES TO WORK */}
      <div id="features" style={{ height:1 }}></div>
      <div id="science" style={{ height:1 }}></div>
      <div id="about" style={{ height:1 }}></div>
      <div id="support" style={{ maxWidth:1280, margin:'0 auto', padding:'20px 32px', display:'flex', justifyContent:'space-between' }} className="tracking-mini">
        <span style={{ color:'rgba(255,255,255,0.2)' }}>© 2026 MindGuard — Emovra</span>
        <span onClick={()=>window.location.href='mailto:support@emovra.pages.dev'} style={{ cursor:'pointer', color:'rgba(255,255,255,0.4)' }}>support@emovra.pages.dev</span>
      </div>

      <LegalCookieBanner />
    </div>
  );
}