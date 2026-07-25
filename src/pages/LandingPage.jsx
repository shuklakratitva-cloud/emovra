import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing" style={{background:"#ffffff", color:"#111827"}}>
      <nav className="navbar" style={{position:"relative", zIndex:9999, background:"#ffffff"}}>
        <h2 style={{color:"#111827"}}>MindGuard</h2>
        <div className="links">
          <a href="#features" style={{color:"#4b5563"}}>Features</a>
          <a href="#about" style={{color:"#4b5563"}}>About</a>
          <a href="#contact" style={{color:"#4b5563"}}>Support</a>
        </div>

        <button
          className="launchBtn"
          onClick={() => window.location.href = "/app"}
          style={{cursor:"pointer", position:"relative", zIndex:10000}}
        >
          Launch App →
        </button>
      </nav>

      <section className="hero" style={{background:"#ffffff"}}>
        <div className="left">
          <span className="badge">AI Mental Wellness Platform</span>
          <h1 style={{color:"#111827"}}>Your Mental<br />Wellness,<br />Understood.</h1>
          <p style={{color:"#4b5563"}}>MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis, voice input and private journaling.</p>
          <div className="buttons">
            <button onClick={() => window.location.href = "/app"} style={{cursor:"pointer"}}>
              Start Analysis
            </button>
            <button className="secondary" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>
              Learn More
            </button>
          </div>
        </div>
        <div className="right" style={{display:"none"}}></div>
      </section>

      <section id="features" className="features" style={{background:"#ffffff"}}>
        <div className="card" style={{background:"#ffffff", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
          <span>🧠</span>
          <h3 style={{color:"#111827", marginTop:12}}>AI Analysis</h3>
          <p style={{color:"#4b5563", fontSize:"14px", fontWeight:500, marginTop:6}}>Detect stress, anxiety and emotional abuse.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
          <span>🎤</span>
          <h3 style={{color:"#111827", marginTop:12}}>Voice Input</h3>
          <p style={{color:"#4b5563", fontSize:"14px", fontWeight:500, marginTop:6}}>Speak naturally and let AI analyse emotions.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
          <span>📖</span>
          <h3 style={{color:"#111827", marginTop:12}}>Mood Journal</h3>
          <p style={{color:"#4b5563", fontSize:"14px", fontWeight:500, marginTop:6}}>Keep track of emotional wellbeing.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
          <span>🚨</span>
          <h3 style={{color:"#111827", marginTop:12}}>Emergency SOS</h3>
          <p style={{color:"#4b5563", fontSize:"14px", fontWeight:500, marginTop:6}}>Contact your emergency person instantly.</p>
        </div>
      </section>
    </div>
  );
}