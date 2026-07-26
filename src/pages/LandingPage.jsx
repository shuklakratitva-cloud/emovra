import { useNavigate } from "react-router-dom";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '20px' }}>MindGuard 🧠</div>
        <nav style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
          <span>Features</span><span>About</span><span>Support</span>
        </nav>
        <button onClick={()=>navigate("/app")} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer' }}>
          Launch App →
        </button>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', marginBottom: '20px' }}>
            AI Mental Wellness Platform
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1, margin: 0 }}>
            Your Mental<br/>Wellness,<br/>Understood.
          </h1>
          <p style={{ marginTop: '20px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '460px' }}>
            Real check-ins, real private journaling, from exam stress to late-night thoughts. Pick your moment. MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
            <button onClick={()=>navigate("/app")} style={{ background: 'white', color: 'black', padding: '14px 28px', borderRadius: '999px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Start Analysis →</button>
            <button style={{ background: 'transparent', color: 'white', padding: '14px 28px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Learn More</button>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(180deg, #1e1b2e, #15131f)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px', height: '320px' }}>
          <div style={{ background: '#0a0a12', borderRadius: '16px', height: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(139,92,246,0.2)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>🧠 Mood Analysis - Active</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>🎙️ Voice Check - Relaxed</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>📔 Private Journal - Encrypted</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>🌿 Grounding Exercises</div>
          </div>
        </div>
      </main>

      {/* Features - This makes it 100+ lines like old */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 100px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { t: 'Emotion AI', d: 'Detects stress from text and voice in real-time.' },
          { t: '100% Private', d: 'Your journals are encrypted. No one can read them.' },
          { t: 'SOS Support', d: 'Emergency contact + Kiran helpline when needed.' },
        ].map(f=>(
          <div key={f.t} style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>{f.t}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.d}</p>
          </div>
        ))}
      </section>

      <LegalCookieBanner />
    </div>
  );
}