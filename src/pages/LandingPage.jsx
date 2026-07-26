import { useNavigate } from "react-router-dom";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>MindGuard 🧠</div>
        <div style={{ display: 'flex', gap: 24, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}><span>Features</span><span>About</span><span>Support</span></div>
        <button onClick={()=>navigate("/app")} style={{ background: '#8b5cf6', color: 'white', border: 0, padding: '10px 20px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>Launch App →</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '6px 12px', borderRadius: 999, fontSize: 11, marginBottom: 20 }}>AI Mental Wellness Platform</div>
          <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, margin: 0 }}>Your Mental<br/>Wellness,<br/>Understood.</h1>
          <p style={{ marginTop: 20, maxWidth: 440, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: 14 }}>Real check-ins, real private journaling, from exam stress to late-night thoughts. Pick your moment. MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis.</p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
            <button onClick={()=>navigate("/app")} style={{ background: '#8b5cf6', color: 'white', border: 0, padding: '14px 28px', borderRadius: 999, fontWeight: 800, cursor: 'pointer' }}>Start Analysis →</button>
            <button style={{ background: 'white', color: 'black', border: 0, padding: '14px 28px', borderRadius: 999, fontWeight: 800, cursor: 'pointer' }}>Learn More</button>
          </div>
        </div>
        <div style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 20 }}>
          <div style={{ background: '#0a0a12', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(139,92,246,0.2)', padding: 12, borderRadius: 12, fontSize: 13 }}>🧠 Mood Analysis - Active</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>🎙️ Voice Check - Relaxed</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>📔 Private Journal - Encrypted</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, fontSize: 13 }}>🌿 Grounding Exercises</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 120px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <div style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}><h3 style={{ margin: 0, fontWeight: 800, color: 'white' }}>Emotion AI</h3><p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Detects stress from text and voice in real-time.</p></div>
        <div style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}><h3 style={{ margin: 0, fontWeight: 800, color: 'white' }}>100% Private</h3><p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Your journals are encrypted. No one can read them.</p></div>
        <div style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}><h3 style={{ margin: 0, fontWeight: 800, color: 'white' }}>SOS Support</h3><p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Emergency contact + Kiran helpline when needed.</p></div>
      </div>

      <LegalCookieBanner />
    </div>
  );
}