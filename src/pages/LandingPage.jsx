import { useNavigate } from "react-router-dom";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">

      {/* Header */}
      <header className="max-w- mx-auto px-6 py-5 flex justify-between items-center">
        <div className="font-black text-">
          MindGuard 🧠
        </div>
        <nav className="hidden md:flex gap-6 text- text-white/60">
          <span>Features</span>
          <span>About</span>
          <span>Support</span>
        </nav>
        <button
          onClick={()=>navigate("/app")}
          className="bg-[#8b5cf6] text-white px-5 py-2 rounded-full text- font-bold"
        >
          Launch App →
        </button>
      </header>

      {/* Hero Section - Your Old UI */}
      <div className="max-w- mx-auto px-6 pt-20 pb-20 grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">

        <div>
          <div className="inline-flex px-3 py-1 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/20 text-[#a78bfa] text- mb-6">
            AI Mental Wellness Platform
          </div>

          <h1 className="text- md:text- font-black leading-[1]">
            Your Mental<br />
            Wellness,<br />
            Understood.
          </h1>

          <p className="mt-5 max-w- text- leading-[1.6] text-white/60">
            Real check-ins, real private journaling, from exam stress to
            late-night thoughts. Pick your moment. MindGuard helps students
            recognise stress, emotional abuse and mental health risks using
            intelligent emotion analysis.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              onClick={()=>navigate("/app")}
              className="px-6 py-3 rounded-full bg-[#8b5cf6] text-white text- font-bold"
            >
              Start Analysis →
            </button>
            <button className="px-6 py-3 rounded-full bg-white text-black text- font-bold">
              Learn More
            </button>
          </div>
        </div>

        <div className="bg-[#15131f] border border-white/10 rounded- p-5">
          <div className="bg-[#0a0a12] rounded- p-4 flex flex-col gap-3">

            <div className="bg-[#8b5cf6]/20 p-3 rounded-xl text-">
              🧠 Mood Analysis - Active
            </div>

            <div className="bg-white/5 p-3 rounded-xl text-">
              🎙️ Voice Check - Relaxed
            </div>

            <div className="bg-white/5 p-3 rounded-xl text-">
              📔 Private Journal - Encrypted
            </div>

            <div className="bg-white/5 p-3 rounded-xl text-">
              🌿 Grounding Exercises
            </div>

          </div>
        </div>

      </div>

      {/* Features - Your old 3 cards */}
      <div className="max-w- mx-auto px-6 pb-20 grid md:grid-cols-3 gap-5">

        <div className="bg-[#15131f] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center mb-4">
            🧠
          </div>
          <h3 className="font-bold text-">
            Emotion AI
          </h3>
          <p className="text- text-white/50 mt-2 leading-6">
            Detects stress from text and voice in real-time.
            Advanced sentiment analysis to capture how you feel.
          </p>
        </div>

        <div className="bg-[#15131f] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center mb-4">
            🔒
          </div>
          <h3 className="font-bold text-">
            100% Private
          </h3>
          <p className="text- text-white/50 mt-2 leading-6">
            Your journals are encrypted. No one can read them.
            End-to-end encryption, your data stays yours always.
          </p>
        </div>

        <div className="bg-[#15131f] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center mb-4">
            🆘
          </div>
          <h3 className="font-bold text-">
            SOS Support
          </h3>
          <p className="text- text-white/50 mt-2 leading-6">
            Emergency contact + Kiran helpline when needed.
            Instant access to breathing exercises & crisis resources.
          </p>
        </div>

      </div>

      {/* How it Works */}
      <div className="max-w- mx-auto px-6 pb-32">
        <h2 className="text- font-black text-center">
          How it Works
        </h2>
        <div className="mt-8 grid md:grid-cols-3 gap-5 text-center">
          <div>
            <div className="text-[#8b5cf6] font-black text-">01</div>
            <p className="mt-2 font-bold">Check-in</p>
            <p className="text- text-white/50 mt-1">Share how you feel via text or voice</p>
          </div>
          <div>
            <div className="text-[#8b5cf6] font-black text-">02</div>
            <p className="mt-2 font-bold">Analyze</p>
            <p className="text- text-white/50 mt-1">AI detects emotion, stress & risk level</p>
          </div>
          <div>
            <div className="text-[#8b5cf6] font-black text-">03</div>
            <p className="mt-2 font-bold">Support</p>
            <p className="text- text-white/50 mt-1">Get coping tools, journaling & SOS help</p>
          </div>
        </div>
      </div>

      <LegalCookieBanner />

    </div>
  );
}