import { useEffect, useState } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";

// PERMANENT CDN IMAGES - no public/ needed, classy, no people, dark
const GOLD_TEXTURE = "https://images.unsplash.com/photo-1518531938570-0da7d4cba9ec?q=80&w=800&auto=format&fit=crop"; // dark gold dust texture
const ZEN_RIPPLE = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop"; // zen stone ripple
const JOURNAL = "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop"; // minimal journal

export default function LandingPage() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };
  const goApp = () => (window.location.href = "/app");
  const goMail = () => (window.location.href = "mailto:support@emovra.pages.dev");
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('reveal-active')), { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#09090b', color:'#fafafa', fontFamily:'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        .serif{font-family:'Instrument Serif',serif}
        .tracking-rolex{letter-spacing:0.22em;text-transform:uppercase;font-size:10px}
        .gold{color:#d4c5a0}
        .reveal{opacity:0;transform:translateY(20px);transition:all 1.2s cubic-bezier(0.16,1,0.3,1)}
        .reveal-active{opacity:1;transform:translateY(0)}
        .hairline{border:0.5px solid rgba(255,255,255,0.08)}
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:9999, backdropFilter:'blur(20px)', background:'rgba(9,9,11,0.85)', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'18px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div onClick={goTop} style={{ fontWeight:800, cursor:'pointer' }}>MindGuard 🧠</div>
          <div style={{ display:'flex', gap:32 }} className="tracking-rolex">
            <span onClick={()=>scrollTo('features')} style={{cursor:'pointer'}}>Features</span>
            <span onClick={()=>scrollTo('craft')} style={{cursor:'pointer'}}>Craft</span>
            <span onClick={()=>scrollTo('about')} style={{cursor:'pointer'}}>About</span>
            <span onClick={()=>scrollTo('support')} style={{cursor:'pointer'}}>Support</span>
          </div>
          <button onClick={goApp} style={{ background:'#fafafa', color:'#000', border:0, padding:'10px 22px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer' }}>Launch App →</button>
        </div>
      </header>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap:60 }}>
        <div className="reveal reveal-active">
          <div className="tracking-rolex gold" style={{ border:'0.5px solid rgba(212,197,160,0.25)', padding:'6px 14px', borderRadius:999, display:'inline-block', marginBottom:24 }}>● Private • Rolex Craft</div>
          <h1 className="serif" style={{ fontSize:'84px', lineHeight:0.9, fontWeight:400, margin:0 }}>Your Mental<br/><span style={{fontStyle:'italic', color:'#d4c5a0'}}>Wellness,</span><br/>Understood.</h1>
          <p style={{ maxWidth:420, color:'rgba(255,255,255,0.55)', fontSize:14.5, lineHeight:1.7, marginTop:24 }}>Built for students. Real check-ins, private journaling, emotion AI that understands exam stress to late-night thoughts.</p>
          <div style={{ marginTop:32, display:'flex', gap:12 }}>
            <button onClick={goApp} style={{ background:'#8b5cf6', color:'white', border:0, padding:'16px 32px', borderRadius:999, cursor:'pointer', fontWeight:600 }}>Start Analysis →</button>
            <button onClick={()=>scrollTo('features')} style={{ background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', color:'white', padding:'16px 32px', borderRadius:999, cursor:'pointer' }}>Learn More</button>
          </div>
        </div>
        <div className="reveal reveal-active hairline" style={{ borderRadius:24, overflow:'hidden', position:'relative', minHeight:440 }}>
          <img src={ZEN_RIPPLE} alt="zen calm no people" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(transparent, rgba(0,0,0,0.9))' }}></div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:20 }}>
            <div className="tracking-rolex" style={{ color:'rgba(255,255,255,0.6)' }}>System • Live</div>
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ background:'rgba(212,197,160,0.15)', padding:12, borderRadius:12, fontSize:13 }}>🧠 Mood Analysis - Active</div>
              <div style={{ background:'rgba(0,0,0,0.5)', padding:12, borderRadius:12, fontSize:13 }}>📔 Private Journal - Encrypted</div>
            </div>
            <button onClick={goApp} style={{ marginTop:14, width:'100%', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', color:'white', padding:12, borderRadius:999, cursor:'pointer' }} className="tracking-rolex">Start Session →</button>
          </div>
        </div>
      </div>

      <div id="features" className="reveal" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
        <img src={JOURNAL} alt="journal no people classy" style={{ width:'100%', borderRadius:20, border:'0.5px solid rgba(255,255,255,0.08)' }} />
        <div>
          <div className="tracking-rolex gold">Features • Perpetual Privacy</div>
          <h2 className="serif" style={{ fontSize:40, marginTop:14 }}>A private journal,<br/>an intelligent guard.</h2>
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:16 }}>
            <div className="hairline" style={{ padding:16, borderRadius:12 }}><b>Emotion AI</b><p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>92% accuracy on student stress detection.</p></div>
            <div className="hairline" style={{ padding:16, borderRadius:12 }}><b>100% Private</b><p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>Encrypted. No tracking.</p></div>
            <div className="hairline" style={{ padding:16, borderRadius:12 }}><b>SOS Support</b><p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>Emergency alert + Kiran helpline.</p></div>
          </div>
          <button onClick={goApp} style={{ marginTop:20, background:'#fafafa', color:'#000', border:0, padding:'12px 24px', borderRadius:999, cursor:'pointer' }} className="tracking-rolex">Try Now →</button>
        </div>
      </div>

      <div id="craft" className="reveal" style={{ maxWidth:1280, margin:'0 auto', padding:'60px 32px', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="serif" style={{ textAlign:'center', fontSize:26, color:'rgba(255,255,255,0.6)' }}>Every interaction measured to <span style={{color:'#fff'}}>0.5s</span> — like a Rolex movement.</div>
      </div>

      <div id="about" className="reveal" style={{ textAlign:'center', padding:'80px 32px', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="tracking-rolex gold">About</div>
        <h2 className="serif" style={{ fontSize:38, marginTop:12 }}>Made for students, not metrics.</h2>
        <p style={{ maxWidth:520, margin:'12px auto', color:'rgba(255,255,255,0.5)' }}>No feeds, no likes. Just a quiet place. Built in Greater Noida.</p>
        <button onClick={()=>scrollTo('support')} style={{ marginTop:16, background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', color:'white', padding:'10px 20px', borderRadius:999, cursor:'pointer' }} className="tracking-rolex">Contact Us</button>
      </div>

      <div id="support" style={{ borderTop:'0.5px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px', display:'flex', justifyContent:'space-between' }} className="tracking-rolex">
          <span style={{ color:'rgba(255,255,255,0.3)' }}>© 2026 MindGuard — Emovra</span>
          <div style={{ display:'flex', gap:20 }}>
            <span onClick={goMail} style={{ cursor:'pointer', color:'rgba(255,255,255,0.6)' }}>support@emovra.pages.dev</span>
            <span onClick={goApp} style={{ cursor:'pointer', color:'#d4c5a0' }}>Launch App →</span>
          </div>
        </div>
      </div>
      <LegalCookieBanner />
    </div>
  );
}