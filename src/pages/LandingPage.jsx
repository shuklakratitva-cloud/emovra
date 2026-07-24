import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      <nav className="navbar">
        <h2>MindGuard</h2>

        <div className="links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Support</a>
        </div>

        <button
          className="launchBtn"
          onClick={() => navigate("/app")}
        >
          Launch App →
        </button>
      </nav>

      <section className="hero">

        <div className="left">

          <span className="badge">
            AI Mental Wellness Platform
          </span>

          <h1>
            Your Mental
            <br />
            Wellness,
            <br />
            Understood.
          </h1>

          <p>
            MindGuard helps students recognise stress,
            emotional abuse and mental health risks using
            intelligent emotion analysis, voice input and
            private journaling.
          </p>

          <div className="buttons">

            <button
              onClick={() => navigate("/app")}
            >
              Start Analysis
            </button>

            <button className="secondary">
              Learn More
            </button>

          </div>

        </div>

        <div className="right">

          <div className="glassCard">

            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900"
              alt=""
            />

            <div className="overlay">

              <h2>AI Mood Analyzer</h2>

              <p>
                Real-time emotional analysis powered by AI.
              </p>

            </div>

          </div>

        </div>

      </section>

      <section
        id="features"
        className="features"
      >

        <div className="card">
          🧠
          <h3>AI Analysis</h3>
          <p>
            Detect stress, anxiety and emotional abuse.
          </p>
        </div>

        <div className="card">
          🎤
          <h3>Voice Input</h3>
          <p>
            Speak naturally and let AI analyse emotions.
          </p>
        </div>

        <div className="card">
          📖
          <h3>Mood Journal</h3>
          <p>
            Keep track of emotional wellbeing.
          </p>
        </div>

        <div className="card">
          🚨
          <h3>Emergency SOS</h3>
          <p>
            Contact your emergency person instantly.
          </p>
        </div>

      </section>

    </div>
  );
}