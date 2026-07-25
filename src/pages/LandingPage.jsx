import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing" style={{background:"#0a0a12", color:"#ffffff", minHeight:"100vh"}}>
      <nav className="navbar" style={{position:"relative", zIndex:9999, background:"transparent"}}>
        <h2 style={{color:"#fff", cursor:"pointer"}} onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>MindGuard</h2>
        <div className="links">
          <a href="#features" onClick={(e)=>{e.preventDefault(); scrollTo('features')}} style={{color:"#cbd5e0", cursor:"pointer"}}>Features</a>
          <a href="#about" onClick={(e)=>{e.preventDefault(); scrollTo('about')}} style={{color:"#cbd5e0", cursor:"pointer"}}>About</a>
          <a href="#contact" onClick={(e)=>{e.preventDefault(); scrollTo('contact')}} style={{color:"#cbd5e0", cursor:"pointer"}}>Support</a>
        </div>
        <button
          className="launchBtn"
          onClick={() => window.location.href = "/app"}
          style={{cursor:"pointer", position:"relative", zIndex:10000, padding:"10px 20px", borderRadius:"24px", background:"#8b5cf6", color:"#fff", border:"none", fontWeight:700}}
        >
          Launch App →
        </button>
      </nav>

      <section className="hero" style={{background:"transparent", padding:"80px 40px"}}>
        <div className="left">
          <span className="badge" style={{background:"rgba(139,92,246,0.15)", color:"#a78bfa", padding:"6px 12px", borderRadius:"20px", fontSize:"12px"}}>AI Mental Wellness Platform</span>
          <h1 style={{color:"#fff", fontSize:"56px", fontWeight:900, lineHeight:"1.1", margin:"20px 0"}}>Your Mental<br />Wellness,<br />Understood.</h1>
          <p style={{color:"#a0aec0", maxWidth:"480px", lineHeight:"1.6"}}>MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis, voice input and private journaling.</p>
          
          {/* FIXED BUTTONS - NOW USEFUL */}
          <div className="buttons" style={{display:"flex", gap:"12px", marginTop:"28px"}}>
            <button 
              onClick={() => window.location.href = "/app"} 
              style={{padding:"14px 26px", borderRadius:"24px", background:"#8b5cf6", color:"#fff", border:"none", fontWeight:800, cursor:"pointer"}}
            >
              Start Analysis
            </button>
            <button 
              className="secondary" 
              onClick={() => scrollTo('features')}
              style={{padding:"14px 26px", borderRadius:"24px", background:"#fff", color:"#111", border:"none", fontWeight:700, cursor:"pointer"}}
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="right" style={{display:"none"}}></div>
      </section>

      <section id="features" className="features" style={{background:"transparent", padding:"40px", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"20px"}}>
        <div className="card" style={{background:"#ffffff", border:"none", padding:"24px", borderRadius:"16px"}}>
          <span style={{fontSize:"24px"}}>🧠</span>
          <h3 style={{color:"#111827", marginTop:12}}>AI Analysis</h3>
          <p style={{color:"#4b5563", fontWeight:500, fontSize:"14px", marginTop:"6px"}}>Detect stress, anxiety and emotional abuse.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none", padding:"24px", borderRadius:"16px"}}>
          <span style={{fontSize:"24px"}}>🎤</span>
          <h3 style={{color:"#111827", marginTop:12}}>Voice Input</h3>
          <p style={{color:"#4b5563", fontWeight:500, fontSize:"14px", marginTop:"6px"}}>Speak naturally and let AI analyse emotions.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none", padding:"24px", borderRadius:"16px"}}>
          <span style={{fontSize:"24px"}}>📖</span>
          <h3 style={{color:"#111827", marginTop:12}}>Mood Journal</h3>
          <p style={{color:"#4b5563", fontWeight:500, fontSize:"14px", marginTop:"6px"}}>Keep track of emotional wellbeing.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none", padding:"24px", borderRadius:"16px"}}>
          <span style={{fontSize:"24px"}}>🚨</span>
          <h3 style={{color:"#111827", marginTop:12}}>Emergency SOS</h3>
          <p style={{color:"#4b5563", fontWeight:500, fontSize:"14px", marginTop:"6px"}}>Contact your emergency person instantly.</p>
        </div>
      </section>

      {/* Added so About & Support links work */}
      <section id="about" style={{padding:"60px 40px", background:"#111119"}}>
        <h2 style={{color:"#fff"}}>About MindGuard</h2>
        <p style={{color:"#a0aec0", maxWidth:"600px", marginTop:"10px"}}>We are building a safe space for students to understand their emotions without judgment. Powered by AI, backed by empathy.</p>
      </section>

      <section id="contact" style={{padding:"60px 40px", background:"#0a0a12", borderTop:"1px solid #222"}}>
        <h2 style={{color:"#fff"}}>Support</h2>
        <p style={{color:"#a0aec0"}}>Need help? Email us at support@emovra.pages.dev or call Tele-MANAS 14416</p>
      </section>
    </div>
  );
}