import { useState } from 'react';
import { analyzeSentiment } from './utils/sentiment.js';
import { detectEmotion } from './utils/emotion.js';
import { calculateRisk } from './utils/risk.js';
import RiskCard from './components/RiskCard.jsx';
import './App.css';

export default function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const sentiment = analyzeSentiment(text);
    const emotion = detectEmotion(text);
    const risk = calculateRisk(text, sentiment, emotion);
    setResult({ ...risk, sentiment, emotion, text });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/favicon.svg" alt="Emovra" width={32} height={32} />
          <strong style={{ fontSize: 20 }}>Emovra</strong>
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>Mental Wellness Check</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 8px' }}>How are you feeling today?</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Your words are analyzed locally and never stored.</p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I've been feeling very anxious and overwhelmed lately, I haven't been sleeping well and small tasks feel hard..."
            style={{ width: '100%', minHeight: 140, padding: 14, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, resize: 'vertical', outline: 'none' }}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={handleAnalyze} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Analyze</button>
            <button onClick={() => { setText(''); setResult(null); }} style={{ background: '#f1f5f9', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer' }}>Clear</button>
          </div>

          {result && (
            <div style={{ marginTop: 24 }}>
              <RiskCard result={result} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <small style={{ color: '#64748b' }}>Sentiment</small><br/><strong>{result.sentiment.label}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <small style={{ color: '#64748b' }}>Emotion</small><br/><strong>{result.emotion.label}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
          Emovra is not a medical diagnosis. If you need immediate help, call Tele-MANAS 14416 • Developed by shuklakratitva-cloud
        </footer>
      </main>
    </div>
  );
}