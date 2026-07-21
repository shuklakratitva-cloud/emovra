// src/components/Journal.jsx - Gemini AI for text + voice-ready
import SupportResources from "./SupportResources";
import React, { useState } from "react";
import useJournal from "../hooks/useJournal";
import { analyzeWithGemini } from "../utils/geminiAnalyzer.js"; // NEW - Gemini
import { checkCrisis } from "../utils/crisisDetection"; // fallback

export default function Journal() {
  const { journalText, setJournalText, entries, totalEntries, addEntry, editEntry, removeEntry, clearJournal } = useJournal();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [crisisLevel, setCrisisLevel] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  function startEditing(entry) { setEditingId(entry.id); setEditText(entry.text); }
  
  async function saveEdit(id) {
    setLoading(true);
    try {
      const result = await analyzeWithGemini(editText, null);
      const level = result?.level?.toLowerCase() || 'low';
      if (level === 'red' || level === 'orange' || result?.isCrisis) {
        setCrisisLevel(result.level === 'RED' ? 'high' : 'medium');
        setShowHelp(true);
      }
      setLastResult(result);
    } catch {
      const result = checkCrisis(editText);
      if (result.level !== 'none') { setCrisisLevel(result.level); setShowHelp(true); }
    }
    editEntry(id, editText);
    setEditingId(null); setEditText(""); setLoading(false);
  }

  async function handleSave() {
    if (!journalText.trim()) return;
    setLoading(true);
    setShowHelp(false);

    let result;
    try {
      // MAIN: Gemini analyzes sentence tone, not just keywords
      result = await analyzeWithGemini(journalText, null);
      setLastResult(result);
      const lvl = result?.level; // GREEN, YELLOW, ORANGE, RED
      if (lvl === 'RED' || lvl === 'ORANGE') {
        setCrisisLevel(lvl === 'RED' ? 'high' : 'medium');
        setShowHelp(true);
      }
    } catch (e) {
      // Fallback to old keyword system if offline
      result = checkCrisis(journalText);
      if (result.level === 'high' || result.level === 'medium') {
        setCrisisLevel(result.level);
        setShowHelp(true);
      }
      setLastResult({...result, source: "keyword-fallback"});
    }
    
    addEntry(journalText);
    setLoading(false);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>📖 Personal Journal - Gemini AI</h2>
      <p style={{fontSize:13, opacity:0.7}}>Now understands tone like "if i disappeared no one would notice" → detects as RED, not just keywords.</p>

      {showHelp && <SupportResources level={crisisLevel} result={lastResult} onClose={() => setShowHelp(false)} />}

      {lastResult && !showHelp && (
        <div style={{marginTop:12, padding:10, borderRadius:8, border:`2px solid ${lastResult.level==='RED'?'#dc2626':lastResult.level==='ORANGE'?'#ea580c':'#16a34a'}`, background:"#f9fafb", fontSize:13}}>
          <b>Gemini Result:</b> {lastResult.level} | {lastResult.score} | {lastResult.emotion} | Source: {lastResult.source}
          <div style={{marginTop:4}}><b>Reason:</b> {lastResult.reasons?.join(", ")}</div>
        </div>
      )}

      <textarea rows={6} value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Write your journal entry here... e.g. i feel like if i disappeared no one would notice" style={{ width: "100%", padding: "12px", borderRadius: "10px", resize: "vertical", marginTop: 12, border: "1px solid #ddd" }} />
      <button onClick={handleSave} disabled={loading} style={{ marginTop: "12px", padding: "10px 20px", cursor: loading?"not-allowed":"pointer", background: loading?"#999":"#aa3bff", color: "#fff", border: "none", borderRadius: 8, opacity: loading?0.6:1 }}>
        {loading ? "Analyzing with Gemini..." : "Save & Analyze"}
      </button>
      
      <hr style={{ margin: "20px 0" }} />
      <h3>Total Entries: {totalEntries}</h3>
      {entries.length === 0 ? <p>No journal entries yet.</p> : entries.map((entry) => (
        <div key={entry.id} style={{ border: "1px solid var(--border, #ddd)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
          {editingId === entry.id ? (
            <>
              <textarea rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "8px" }} />
              <button onClick={() => saveEdit(entry.id)} disabled={loading} style={{ padding: "6px 14px", background: "#aa3bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{loading?"Analyzing...":"Save"}</button>
              <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ marginLeft: "10px", padding: "6px 14px", cursor: "pointer" }}>Cancel</button>
            </>
          ) : (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{entry.text}</p>
              <small>Created: {new Date(entry.timestamp).toLocaleString()}</small>
              {entry.updatedAt && <><br /><small>Updated: {new Date(entry.updatedAt).toLocaleString()}</small></>}
              <br /><br />
              <button onClick={() => startEditing(entry)} style={{ padding: "6px 12px", cursor: "pointer" }}>Edit</button>
              <button onClick={() => removeEntry(entry.id)} style={{ marginLeft: "10px", padding: "6px 12px", cursor: "pointer" }}>Delete</button>
            </>
          )}
        </div>
      ))}
      {entries.length > 0 && <button onClick={clearJournal} style={{ marginTop: "20px", background: "#dc2626", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "10px", cursor: "pointer" }}>Clear Journal</button>}
    </div>
  );
}