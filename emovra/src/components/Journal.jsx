// src/components/Journal.jsx

import React, { useState } from "react";
import useJournal from "../hooks/useJournal";

export default function Journal() {
  const { journalText, setJournalText, entries, totalEntries, addEntry, editEntry, removeEntry, clearJournal } = useJournal();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  function startEditing(entry) { setEditingId(entry.id); setEditText(entry.text); }
  function saveEdit(id) { editEntry(id, editText); setEditingId(null); setEditText(""); }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>📖 Personal Journal</h2>
      <p>Write about your thoughts and feelings.</p>
      <textarea rows={6} value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Write your journal entry here..." style={{ width: "100%", padding: "12px", borderRadius: "10px", resize: "vertical", marginTop: 12 }} />
      <button onClick={() => addEntry(journalText)} style={{ marginTop: "12px", padding: "10px 20px", cursor: "pointer", background: "#aa3bff", color: "#fff", border: "none", borderRadius: 8 }}>Save Entry</button>
      <hr style={{ margin: "20px 0" }} />
      <h3>Total Entries: {totalEntries}</h3>
      {entries.length === 0 ? <p>No journal entries yet.</p> : entries.map((entry) => (
        <div key={entry.id} style={{ border: "1px solid var(--border, #ddd)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
          {editingId === entry.id ? (
            <>
              <textarea rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", marginBottom: "10px" }} />
              <button onClick={() => saveEdit(entry.id)}>Save</button>
              <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ marginLeft: "10px" }}>Cancel</button>
            </>
          ) : (
            <>
              <p>{entry.text}</p>
              <small>Created: {new Date(entry.timestamp).toLocaleString()}</small>
              {entry.updatedAt && <><br /><small>Updated: {new Date(entry.updatedAt).toLocaleString()}</small></>}
              <br /><br />
              <button onClick={() => startEditing(entry)}>Edit</button>
              <button onClick={() => removeEntry(entry.id)} style={{ marginLeft: "10px" }}>Delete</button>
            </>
          )}
        </div>
      ))}
      {entries.length > 0 && <button onClick={clearJournal} style={{ marginTop: "20px", background: "#dc2626", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "10px", cursor: "pointer" }}>Clear Journal</button>}
    </div>
  );
}