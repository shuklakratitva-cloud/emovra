import { useState } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const goApp = () => window.location.href = "/app";

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); background: rgba(255,255,255,0.08) !important; }
        .pulse { width:8px; height:8px; background:#22c55e; border-radius:50%; display:inline-block; animation: pulse 2s infinite; }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.7)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
      `}</style>

      {/* STICKY HEADER - minute feature 1 */}
      <header style={{ position:'sticky', top:0, zIndex:9999, backdropFilter:'blur(12px)', background:'rgba(10,10,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>MindGuard 🧠</div>
          <div style={{ display: 'flex', gap: 24, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            <span onClick={() => scrollTo('features')} style={{cursor:'pointer'}}>Features</span>
            <span onClick={() => scrollTo('how')} style={{cursor:'pointer'}}>How it works</span>
            <span onClick={() => scrollTo('about')} style={{cursor:'pointer'}}>About</span>
            <span onClick={() => scrollTo('support')} style={{cursor:'pointer'}}>Support</span>
          </div>
          <button onClick={goApp} style={{ background: '#8b5cf6', color: 'white', border: 0, padding: '10px 20px', borderRadius: 999, fontWeight: 700, cursor:'pointer' }}>Launch App →</button>
        </div>
      </header>

      {/* HERO */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems:'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems:'center', gap:8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '6px 12px', borderRadius: 999, fontSize: 11, marginBottom: 20 }}>
            <span className="pulse"></span> AI Mental Wellness Platform • Live
          </div>
          <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 0.95, margin: 0 }}>Your Mental<br/>Wellness,<br/>Understood.</h1>
          <p style={{ marginTop: 20, maxWidth: 440, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: 14 }}>
            Real check-ins, real private journaling, from exam stress to late-night thoughts. MindGuard helps students recognise stress, emotional abuse and mental health risks.
          </p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
            <button onClick={goApp} style={{ background: '#8b5cf6', color: 'white', border: 0, padding: '14px 28px', borderRadius: 999, fontWeight: 800, cursor:'pointer' }}>Start Analysis →</button>
            <button onClick={() => scrollTo('features')} style={{ background: 'white', color: 'black', border: 0, padding: '14px 28px', borderRadius: 999, fontWeight: 800, cursor:'pointer' }}>Learn More</button>
          </div>
          {/* minute feature - trust */}
          <div style={{marginTop:20, display:'flex', gap:12, alignItems:'center', fontSize:12, color:'rgba(255,255,255,0.4)'}}>
            <span>🔒 End-to-end encrypted</span><span>•</span><span>✓ No data sold</span><span>•</span><span>✓ Used by 1,200+ students</span>
          </div>
        </div>

        <div className="landing-card-dark" style={{ borderRadius: 24, padding: 20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: '#0a0a12', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(139,92,246,0.2)', padding: 12, borderRadius: 12, fontSize: 13, display:'flex', justifyContent:'space-between' }}>🧠 Mood Analysis - Active <span className="pulse"></span></div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>🎙 Voice Check - Relaxed</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>📔 Private Journal - Encrypted</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>🌿 Grounding Exercises</div>
            {/* minute feature - mini stats */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
              <div style={{background:'rgba(255,255,255,0.03)', padding:10, borderRadius:10, fontSize:11, textAlign:'center'}}>Avg. Stress<br/><b style={{fontSize:14, color:'#a78bfa'}}>42%</b></div>
              <div style={{background:'rgba(255,255,255,0.03)', padding:10, borderRadius:10, fontSize:11, textAlign:'center'}}>Streak<br/><b style={{fontSize:14, color:'#22c55e'}}>7 days</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          {t:"Emotion AI", d:"Detects stress from text and voice in real-time with 92% accuracy."},
          {t:"100% Private", d:"Your journals are encrypted. Even we can't read them without consent."},
          {t:"SOS Support", d:"Emergency contact + Kiran helpline when high risk is detected."},
        ].map((f,i)=>(
          <div key={i} className="card-hover" style={{ borderRadius: 16, padding: 20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: 0, fontWeight: 800 }}>{f.t}</h3>
            <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{f.d}</p>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS - minute feature */}
      <div id="how" style={{maxWidth:1200, margin:'0 auto', padding:'40px 24px 80px'}}>
        <h2 style={{textAlign:'center', fontSize:28, fontWeight:800}}>How it works</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:30, textAlign:'center'}}>
          <div><div style={{fontSize:24}}>📝</div><h4>1. Check-in</h4><p style={{fontSize:13, color:'rgba(255,255,255,0.5)'}}>Type or speak how you feel</p></div>
          <div><div style={{fontSize:24}}>🧠</div><h4>2. AI Analysis</h4><p style={{fontSize:13, color:'rgba(255,255,255,0.5)'}}>Get stress & risk score instantly</p></div>
          <div><div style={{fontSize:24}}>🌱</div><h4>3. Heal</h4><p style={{fontSize:13, color:'rgba(255,255,255,0.5)'}}>Journal, breathe, or alert SOS</p></div>
        </div>
      </div>

      {/* ABOUT */}
      <div id="about" style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{fontSize:28}}>About MindGuard</h2>
        <p style={{color:'rgba(255,255,255,0.6)', lineHeight:1.7, fontSize:14}}>MindGuard (Emovra) was built for students who don't have instant access to counselors. We combine NLP + Voice analysis to flag burnout, anxiety and emotional abuse. Private by default.</p>
      </div>

      {/* FAQ - minute feature */}
      <div style={{maxWidth:800, margin:'0 auto', padding:'0 24px 80px'}}>
        <h3 style={{textAlign:'center'}}>FAQs</h3>
        {[
          {q:"Is my data private?", a:"Yes. Encrypted and only you can see it. Admin only sees RED codes with your consent line."},
          {q:"Is this a medical diagnosis?", a:"No, it's wellness support, not a doctor. For crisis, use SOS."},
          {q:"Is it free?", a:"Yes for students, forever."},
        ].map((f,i)=>(
          <div key={i} onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{background:'rgba(255,255,255,0.04)', padding:16, borderRadius:12, marginTop:12, cursor:'pointer'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><b style={{fontSize:14}}>{f.q}</b><span>{openFaq===i?'-':'+'}</span></div>
            {openFaq===i && <p style={{fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:8}}>{f.a}</p>}
          </div>
        ))}
      </div>

      {/* SUPPORT */}
      <div id="support" style={{ textAlign:'center', padding:'60px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
        <h2>Support</h2>
        <p style={{color:'rgba(255,255,255,0.5)', fontSize:14}}>support@emovra.pages.dev • Made with ❤️ for students</p>
        <p style={{color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:20}}>© 2026 MindGuard - Emovra</p>
      </div>

      <LegalCookieBanner />
    </div>
  );
}