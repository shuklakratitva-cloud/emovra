// src/components/VoiceToneAnalyzer.jsx
import { useState } from "react";
import { useVoiceTone } from "../hooks/useVoiceTone";

export default function VoiceToneAnalyzer({ onResult }) {
  const { analyzeTone } = useVoiceTone();
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);

  async function handleRecord() {
    setRecording(true);
    const data = await analyzeTone(5000); // 5 sec sample
    setResult(data);
    setRecording(false);
    if (onResult) onResult(data);
  }

  return (
    <div style={{maxWidth:680, width:"100%", background:"var(--card-bg)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginTop:16, textAlign:"left"}}>
      <h3 style={{margin:0}}>🎙️ Voice Tone & Pressure Analysis</h3>
      <p style={{fontSize:12, opacity:.7, margin:"6px 0"}}>Speak naturally for 5 seconds. We analyze pitch, volume, pauses - not what you say.</p>
      <button onClick={handleRecord} disabled={recording} className="primary-btn" style={{marginTop:8}}>
        {recording ? "Listening... Speak Now (5s)" : "Start Voice Scan"}
      </button>

      {result && (
        <div style={{marginTop:14, display:"grid", gap:8}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <span style={{padding:"6px 10px", borderRadius:8, background:"#fef9c3", fontSize:12}}><b>Tone:</b> {result.tone}</span>
            <span style={{padding:"6px 10px", borderRadius:8, background: result.pressure.includes("High")?"#fee2e2":"#dcfce7", fontSize:12}}><b>Pressure:</b> {result.pressure}</span>
            <span style={{padding:"6px 10px", borderRadius:8, background:"#dbeafe", fontSize:12}}><b>Confidence:</b> {result.confidence}</span>
          </div>
          <div style={{fontSize:13, lineHeight:1.7, background:"#f9fafb", padding:10, borderRadius:8}}>
            <div>🔊 Avg Volume: {result.avgVolume} / 100</div>
            <div>📈 Instability (Variance): {result.variance}</div>
            <div>🎵 Pitch Index: {result.avgPitch}</div>
            <div>⏸️ Pause Ratio: {result.pauseRatio}%</div>
            <div>⚡ Speech Rate: {result.speechRate} units/sec</div>
          </div>
          <small style={{opacity:.6}}>Note: This is prosody analysis (how you speak), not clinical diagnosis. For demo + wellness only.</small>
        </div>
      )}
    </div>
  );
}