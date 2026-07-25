import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing" style={{background:"#0a0a12", color:"#ffffff", minHeight:"100vh"}}>
      <nav className="navbar" style={{position:"relative", zIndex:9999, background:"transparent"}}>
        <h2 style={{color:"#fff"}}>MindGuard</h2>
        <div className="links">
          <a href="#features" style={{color:"#cbd5e0"}}>Features</a>
          <a href="#about" style={{color:"#cbd5e0"}}>About</a>
          <a href="#contact" style={{color:"#cbd5e0"}}>Support</a>
        </div>
        <button
          className="launchBtn"
          onClick={() => window.location.href = "/app"}
          style={{cursor:"pointer", position:"relative", zIndex:10000}}
        >
          Launch App →
        </button>
      </nav>

      <section className="hero" style={{background:"transparent"}}>
        <div className="left">
          <span className="badge">AI Mental Wellness Platform</span>
          <h1 style={{color:"#fff"}}>Your Mental<br />Wellness,<br />Understood.</h1>
          <p style={{color:"#a0aec0"}}>MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis, voice input and private journaling.</p>
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

      <section id="features" className="features" style={{background:"transparent"}}>
        <div className="card" style={{background:"#ffffff", border:"none"}}>
          <span>🧠</span>
          <h3 style={{color:"#111827"}}>AI Analysis</h3>
          <p style={{color:"#4b5563", fontWeight:500}}>Detect stress, anxiety and emotional abuse.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none"}}>
          <span>🎤</span>
          <h3 style={{color:"#111827"}}>Voice Input</h3>
          <p style={{color:"#4b5563", fontWeight:500}}>Speak naturally and let AI analyse emotions.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none"}}>
          <span>📖</span>
          <h3 style={{color:"#111827"}}>Mood Journal</h3>
          <p style={{color:"#4b5563", fontWeight:500}}>Keep track of emotional wellbeing.</p>
        </div>
        <div className="card" style={{background:"#ffffff", border:"none"}}>
          <span>🚨</span>
          <h3 style={{color:"#111827"}}>Emergency SOS</h3>
          <p style={{color:"#4b5563", fontWeight:500}}>Contact your emergency person instantly.</p>
        </div>
      </section>
    </div>
  );
}