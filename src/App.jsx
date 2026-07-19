import { useState } from 'react';
import MoodTracker from './components/MoodTracker.jsx';
import Journal from './components/Journal.jsx';
import GroundingExercises from './components/GroundingExercises.jsx';
import MoodChart from './components/MoodChart.jsx';
import RiskCard from './components/RiskCard.jsx';
import Footer from './components/Footer.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import useMood from './hooks/useMood.js';
import { analyzeSentiment } from './utils/sentiment.js';
import { detectEmotion } from './utils/emotion.js';
import { calculateRisk } from './utils/risk.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';

export default function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { history, addMood } = useMood();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const sentiment = analyzeSentiment(text);
      const emotion = detectEmotion(text);
      const risk = calculateRisk(text, sentiment, emotion);
      
      const newResult = {
        text,
        ...sentiment,
        ...emotion,
        ...risk,
        id: Date.now(),
        time: new Date().toLocaleString()
      };
      
      setResult(newResult);
      addMood(newResult);
      setLoading(false);
    }, 400);
  };

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        
        {/* HEADER WITH LOGO */}
        <header style={{ 
          maxWidth: 1100, margin: '0 auto', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, backdropFilter: 'blur(12px)', zIndex: 10,
          background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            {/* LOGO - uses your favicon.svg */}
            <img 
              src="/favicon.svg" 
              alt="Emovra Logo" 
              style={{
                width:40, height:40, borderRadius:10,
                background:'linear-gradient(135deg,#8b5cf6,#6366f1)',
                padding:6, boxShadow:'0 4px 12px rgba(139,92,246,0.3)'
              }} 
            />
            <div>
              <h1 style={{fontSize:18, fontWeight:700, margin:0, lineHeight:1.2}}>Mental Health Support App</h1>
              <small style={{opacity:0.6, fontSize:12}}>You matter. Your feelings matter.</small>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="container" style={{paddingTop:24, paddingBottom:20}}>
          
          {/* TOP GRID */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start'}}>
            
            {/* LEFT - INPUT */}
            <div style={{padding:20, border:'1px solid var(--border)', borderRadius:16, background:'var(--card-bg)'}}>
              <h3 style={{marginBottom:4}}>How are you feeling today?</h3>
              <p style={{fontSize:13, opacity:0.6, marginBottom:12}}>Share your thoughts and let us help you.</p>
              
              <textarea
                value={text}
                onChange={(e)=>setText(e.target.value)}
                placeholder="Type your thoughts here..."
                maxLength={1000}
                style={{width:'100%', minHeight:120, padding:12, resize:'vertical'}}
              />
              <div style={{textAlign:'right', fontSize:12, opacity:0.5, marginTop:4}}>{text.length} / 1000</div>

              <div style={{display:'flex', gap:10, marginTop:12, flexWrap:'wrap'}}>
                <button onClick={handleAnalyze} disabled={loading || !text.trim()}>
                  {loading ? 'Analyzing...' : '🔍 Analyze'}
                </button>
                <button className="secondary" onClick={()=>setText('')}>🗑️ Clear</button>
              </div>
              <small style={{display:'block', marginTop:10, opacity:0.5, fontSize:11}}>🔒 Your data is private and stored only on your device.</small>
            </div>

            {/* RIGHT - RESULT */}
            <div>
              {result ? <RiskCard result={result} /> : (
                <div style={{padding:20, border:'1px solid var(--border)', borderRadius:16, background:'var(--card-bg)', minHeight:200}}>
                  <strong>Analysis Result</strong>
                  <p style={{opacity:0.5, fontSize:13, marginTop:20, textAlign:'center'}}>Your analysis will appear here after you click Analyze</p>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE 3 COLUMNS */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginTop:20}}>
            <MoodTracker />
            <Journal />
            <GroundingExercises />
          </div>

          {/* CHART */}
          <div style={{marginTop:20, display:'flex', justifyContent:'center'}}>
            <MoodChart history={history} />
          </div>

          {/* SUPPORT */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginTop:20}}>
            <div style={{padding:16, border:'1px solid var(--border)', borderRadius:16, background:'var(--card-bg)'}}>
              <strong>📞 Tele-MANAS Support</strong>
              <p style={{fontSize:12, opacity:0.7, marginTop:6}}>India's national mental health support service. Trained professionals are here to listen and help you.</p>
            </div>
            <div style={{padding:16, border:'1px solid var(--border)', borderRadius:16, background:'var(--card-bg)', textAlign:'center'}}>
              <div>Primary Helpline</div>
              <strong style={{color:'#8b5cf6'}}>14416</strong><br/>
              <button style={{marginTop:8, padding:'6px 14px', fontSize:12}}>Call Now</button>
            </div>
            <div style={{padding:16, border:'1px solid var(--border)', borderRadius:16, background:'var(--card-bg)'}}>
              <strong style={{fontSize:13}}>⚠️ Emergency Notice</strong>
              <p style={{fontSize:11, opacity:0.7, marginTop:6}}>If you are in immediate danger or having thoughts of self-harm, please contact emergency services or go to the nearest hospital immediately.</p>
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}