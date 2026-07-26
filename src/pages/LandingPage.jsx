import { useNavigate } from "react-router-dom";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;600;700;900&display=swap');`}</style>

      {/* HEADER - Original theme + Gavelling pill minute detail */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '-0.02em' }}>MindGuard 🧠</div>
        
        {/* Minute Detail from Gavelling: pill nav */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '4px', gap: '2px' }}>
          {['Features','About','Support'].map(t=>(
            <div key={t} style={{ padding: '6px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', borderRadius: '100px' }}>{t}</div>
          ))}
          <div style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '100px', fontWeight: 600 }}>Conferences</div>
        </div>

        <button onClick={()=>navigate("/app")} style={{ padding: '10px 20px', borderRadius: '100px', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
          Launch App →
        </button>
      </div>

      {/* HERO - Your original + Rolex small caps + Gavelling big typography */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px 40px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
        <div>
          {/* Rolex Minute Detail: small tracking label */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', padding: '6px 12px', borderRadius: '100px', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', background: '#8b5cf6', borderRadius: '50%' }}></span>
            AI Mental Wellness Platform
          </div>

          <h1 style={{ fontSize: '64px', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', margin: 0 }}>
            Your Mental<br/>
            Wellness,<br/>
            <span style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontStyle: 'italic', color: '#a78bfa' }}>Understood.</span>
          </h1>

          <p style={{ marginTop: '20px', maxWidth: '480px', fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
            Real check-ins, real private journaling, from exam stress to late-night thoughts. Pick your moment. MindGuard helps students recognise stress using intelligent emotion analysis.
          </p>

          <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
            <button onClick={()=>navigate("/app")} style={{ padding: '14px 28px', borderRadius: '100px', background: 'white', color: 'black', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>Start Analysis →</button>
            <button style={{ padding: '14px 28px', borderRadius: '100px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Learn More</button>
          </div>

          {/* Gavelling Minute Detail: Organising one? link */}
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Organising one? <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>List it free ↗</span></div>
        </div>

        {/* RIGHT - Your original image area + Gavelling card style minute detail */}
        <div style={{ position: 'relative' }}>
          <div style={{ background: 'radial-gradient(100% 100% at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 60%)', position: 'absolute', inset: '-20px', zIndex: 0 }}></div>
          <div style={{ position: 'relative', background: 'linear-gradient(180deg, #1e1b2e 0%, #15131f 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px', zIndex: 1 }}>
            {/* Fake App UI like original */}
            <div style={{ height: '300px', background: '#0a0a12', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div></div>
              <div style={{ background: 'rgba(139,92,246,0.15)', padding: '12px', borderRadius: '12px', fontSize: '12px' }}>💜 Mood: Calm - 85% positive detected</div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', fontSize: '12px' }}>🎙️ Voice tone: Relaxed</div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', fontSize: '12px' }}>📔 Journal: Today I felt better...</div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR - Gavelling minute detail but in your purple theme */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>127</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a78bfa', marginTop: '4px' }}>Check-ins done</div>
          </div>
          <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>27,508</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a78bfa', marginTop: '4px' }}>Students supported</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>45</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a78bfa', marginTop: '4px' }}>Countries</div>
          </div>
        </div>
      </div>

      {/* FEATURE CARDS - MUN in India style but your theme */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Mood Tools in India</h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Private tools around New Delhi and across India.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Mood Analysis', date: '25-26 Jul 2026', place: 'Private, IN', price: 'FREE', icon: '🧠' },
            { name: 'Voice Check', date: '1-2 Aug 2026', place: 'Online, IN', price: 'FREE', icon: '🎙️' },
            { name: 'Journal Safe', date: '9-9 Aug 2026', place: 'Encrypted, IN', price: '₹99', icon: '📔' },
            { name: 'Grounding', date: '15-16 Aug 2026', place: '24/7, IN', price: '₹450', icon: '🌿' },
          ].map(c=>(
            <div key={c.name} style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ height: '90px', background: '#1e1b2e', position: 'relative', padding: '12px' }}>
                <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '100px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>📅 {c.date}</span>
                <div style={{ position: 'absolute', bottom: '-18px', left: '16px', width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
              </div>
              <div style={{ padding: '28px 16px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '100px', background: c.price==='FREE' ? '#a78bfa' : 'rgba(255,255,255,0.08)', color: c.price==='FREE' ? 'black' : 'white', fontWeight: 700 }}>{c.price}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{c.place}</div>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '100px' }}>👥 100</span>
                  <button onClick={()=>navigate("/app")} style={{ padding: '6px 12px', borderRadius: '100px', background: '#f7e9a0', color: 'black', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>APPLY →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LegalCookieBanner />
    </div>
  );
}