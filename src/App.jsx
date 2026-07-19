import { useState } from 'react';
import { analyzeSentiment } from './utils/sentiment.js';
import { detectEmotion } from './utils/emotion.js';
import { calculateRisk } from './utils/risk.js';
import RiskCard from './components/RiskCard.jsx';

export default function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const doAnalyze = () => {
    if (!text.trim()) return;
    const sentiment = analyzeSentiment(text);
    const emotion = detectEmotion(text);
    const risk = calculateRisk(text, sentiment, emotion);
    setResult(risk);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/favicon.svg" width={28} height={28} alt="logo" />
        <b style={{ fontSize: 18 }}>Emovra</b>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>pH Wellness Scale • Private & Local</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>How are you feeling today?</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '6px 0 16px' }}>Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>Enter</kbd> to analyze, <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>Shift+Enter</kbd> for new line.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                doAnalyze();
              }
            }}
            placeholder="Ex: thak gayi hu, neend nahi aati, wo roz gaali deta hai aur control karta hai...  ya  I've been anxious and overwhelmed..."
            style={{ width: '100%', minHeight: 150, padding: 14, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={doAnalyze} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Analyze</button>
            <button onClick={() => { setText(''); setResult(null); }} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: 10, cursor: 'pointer' }}>Clear</button>
          </div>

          {result && (
            <div style={{ marginTop: 22 }}>
              <RiskCard result={result} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}><small style={{ color: '#64748b' }}>Sentiment</small><br /><b>{result.sentiment?.label || analyzeSentiment(text).label}</b></div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}><small style={{ color: '#64748b' }}>Emotion</small><br /><b>{result.emotion?.label || detectEmotion(text).label}</b></div>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 18 }}>Not a medical diagnosis. If unsafe, call Tele-MANAS 14416. • Emovra</p>
      </main>
    </div>
  );
}