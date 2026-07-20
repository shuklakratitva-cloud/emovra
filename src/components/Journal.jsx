// src/components/Journal.jsx
import SupportResources from "./SupportResources";
import React, { useState } from "react";
import useJournal from "../hooks/useJournal";
import { checkCrisis } from "../utils/crisisDetection";

export default function Journal() {
  const { journalText, setJournalText, entries, totalEntries, addEntry, editEntry, removeEntry, clearJournal } = useJournal();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [crisisLevel, setCrisisLevel] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  function startEditing(entry) { setEditingId(entry.id); setEditText(entry.text); }
  
  function saveEdit(id) {
    const result = checkCrisis(editText);
    if (result.level !== 'none') {
      setCrisisLevel(result.level);
      setShowHelp(true);
    }
    editEntry(id, editText);
    setEditingId(null);
    setEditText("");
  }

  function handleSave() {
    if (!journalText.trim()) return;
    const result = checkCrisis(journalText);
    
    if (result.level === 'high' || result.level === 'medium') {
      setCrisisLevel(result.level);
      setShowHelp(true);
    }
    
    addEntry(journalText);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>📖 Personal Journal</h2>
      <p>Write about your thoughts and feelings.</p>

      {/* NEW: This is the single line that replaces the old banner */}
      {showHelp && <SupportResources level={crisisLevel} onClose={() => setShowHelp(false)} />}

      <textarea rows={6} value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Write your journal entry here..." style={{ width: "100%", padding: "12px", borderRadius: "10px", resize: "vertical", marginTop: 12, border: "1px solid #ddd" }} />
      <button onClick={handleSave} style={{ marginTop: "12px", padding: "10px 20px", cursor: "pointer", background: "#aa3bff", color: "#fff", border: "none", borderRadius: 8 }}>Save Entry</button>
      
      <hr style={{ margin: "20px 0" }} />
      <h3>Total Entries: {totalEntries}</h3>
      {entries.length === 0 ? <p>No journal entries yet.</p> : entries.map((entry) => (
        <div key={entry.id} style={{ border: "1px solid var(--border, #ddd)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
          {editingId === entry.id ? (
            <>
              <textarea rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "8px" }} />
              <button onClick={() => saveEdit(entry.id)} style={{ padding: "6px 14px", background: "#aa3bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Save</button>
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