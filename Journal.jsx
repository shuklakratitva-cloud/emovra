import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function VoiceNoteRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const { t } = useLanguage();

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecorded?.(url);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch {
      alert(t("journal.micBlocked"));
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function clear() {
    setAudioUrl(null);
    onRecorded?.(null);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
      {!recording ? (
        <button type="button" onClick={start} style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
          🎙️ {t("journal.addVoiceNote")}
        </button>
      ) : (
        <button type="button" onClick={stop} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          ⏹️ {t("journal.stopRecording")}
        </button>
      )}
      {audioUrl && (
        <>
          <audio controls src={audioUrl} style={{ height: 32 }} />
          <button type="button" onClick={clear} style={{ fontSize: 11, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>
            {t("journal.remove")}
          </button>
        </>
      )}
    </div>
  );
}

function SharedJournalPanel() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");
  const [openJournal, setOpenJournal] = useState(null);
  const [threadText, setThreadText] = useState("");
  const { t } = useLanguage();

  const headers = authHeaders();

  async function loadMine() {
    if (!token) return;
    try {
      const res = await fetch(`${API}/journal-share/mine`, { headers });
      const data = await res.json();
      if (data.success) setJournals(data.journals);
    } catch {}
  }

  useEffect(() => { loadMine(); }, [token]);

  async function createJournal() {
    if (!token) { setMsg(t("journal.signInToCreate")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/journal-share/create`, { method: "POST", headers, body: JSON.stringify({ title: "Our Journal" }) });
      const data = await res.json();
      if (data.success) { setJournals((j) => [data.journal, ...j]); setMsg(t("journal.createdInviteCode", { code: data.journal.inviteCode })); }
      else setMsg(data.message || t("journal.couldNotCreate"));
    } catch { setMsg(t("journal.networkError")); }
    setLoading(false);
  }

  async function joinJournal() {
    if (!token) { setMsg(t("journal.signInToJoin")); return; }
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/journal-share/join`, { method: "POST", headers, body: JSON.stringify({ inviteCode: joinCode.trim() }) });
      const data = await res.json();
      if (data.success) { setJournals((j) => [data.journal, ...j.filter(x => x._id !== data.journal._id)]); setMsg(t("journal.joined")); setJoinCode(""); }
      else setMsg(data.message || t("journal.invalidInviteCode"));
    } catch { setMsg(t("journal.networkError")); }
    setLoading(false);
  }

  async function openThread(id) {
    try {
      const res = await fetch(`${API}/journal-share/${id}`, { headers });
      const data = await res.json();
      if (data.success) setOpenJournal(data.journal);
    } catch {}
  }

  async function postEntry() {
    if (!threadText.trim() || !openJournal) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/journal-share/${openJournal._id}/entry`, { method: "POST", headers, body: JSON.stringify({ text: threadText.trim() }) });
      const data = await res.json();
      if (data.success) { setOpenJournal(data.journal); setThreadText(""); }
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>👯 {t("journal.sharedJournalTitle")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("journal.sharedJournalSubtitle")}</p>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={createJournal} disabled={loading} style={{ padding: "10px 18px", borderRadius: 20, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          + {t("journal.startSharedJournal")}
        </button>
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder={t("journal.enterInviteCode")} style={{ padding: "10px 14px", borderRadius: 20, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 13 }} />
        <button onClick={joinJournal} disabled={loading} style={{ padding: "10px 18px", borderRadius: 20, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13 }}>
          {t("journal.join")}
        </button>
      </div>

      {msg && <p style={{ fontSize: 12, marginTop: 8, color: "var(--text-h)" }}>{msg}</p>}

      {journals.length > 0 && !openJournal && (
        <div style={{ marginTop: 16 }}>
          {journals.map((j) => (
            <div key={j._id} onClick={() => openThread(j._id)} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10, marginTop: 8, cursor: "pointer" }}>
              <b>{j.title}</b>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                {t("journal.journalMeta", { code: j.inviteCode, collabCount: j.collaborators.length, entryCount: j.entries.length })}
              </div>
            </div>
          ))}
        </div>
      )}

      {openJournal && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setOpenJournal(null)} style={{ fontSize: 12, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", marginBottom: 10 }}>
            ← {t("journal.backToSharedJournals")}
          </button>
          <h3>{openJournal.title} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>· {t("journal.inviteCodeLabel", { code: openJournal.inviteCode })}</span></h3>

          <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 10 }}>
            {openJournal.entries.length === 0 ? <p style={{ opacity: 0.6, fontSize: 13 }}>{t("journal.noEntriesYet")}</p> : openJournal.entries.map((e) => (
              <div key={e._id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10, marginTop: 8 }}>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{e.text}</p>
                <small style={{ opacity: 0.5 }}>{e.authorName || t("journal.someone")} · {new Date(e.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>

          <textarea rows={3} value={threadText} onChange={(e) => setThreadText(e.target.value)} placeholder={t("journal.writeSomethingPlaceholder")} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10 }} />
          <button onClick={postEntry} disabled={loading} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 20, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            {loading ? t("journal.posting") : t("journal.post")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Journal() {
  const [journalText, setJournalText] = useState("");
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(null);
  const [search, setSearch] = useState(""); // NEW: client-side search - entries are already decrypted for the owner once loaded, no new backend endpoint needed
  const { t } = useLanguage();

  async function loadEntries() {
    try {
      const res = await fetch(`${API}/private-journal`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setEntries(data.entries);
    } catch {}
  }

  useEffect(() => { loadEntries(); }, []);

  function startEditing(entry) { setEditingId(entry._id); setEditText(entry.text); }

  async function saveEdit(id) {
    if (!editText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/private-journal/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ text: editText }) });
      const data = await res.json();
      if (data.success) setEntries((es) => es.map((e) => (e._id === id ? data.entry : e)));
    } catch {}
    setEditingId(null); setEditText(""); setLoading(false);
  }

  async function handleSave() {
    if (!journalText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/private-journal`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ text: journalText }) });
      const data = await res.json();
      if (data.success) setEntries((es) => [data.entry, ...es]);
      setJournalText("");
      setVoiceNoteUrl(null);
    } catch {
      alert(t("journal.couldNotSave"));
    }
    setLoading(false);
  }

  async function removeEntry(id) {
    if (!confirm(t("journal.confirmDeleteEntry"))) return;
    try {
      await fetch(`${API}/private-journal/${id}`, { method: "DELETE", headers: authHeaders() });
      setEntries((es) => es.filter((e) => e._id !== id));
    } catch {}
  }

  async function clearJournal() {
    if (!confirm(t("journal.confirmDeleteAll"))) return;
    try {
      await fetch(`${API}/private-journal`, { method: "DELETE", headers: authHeaders() });
      setEntries([]);
    } catch {}
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>📖 {t("journal.personalJournalTitle")}</h2>
      <p style={{fontSize:13, opacity:0.7}}>
        🔒 {t("journal.privacyNote")}
      </p>

      <textarea rows={6} value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={t("journal.writeEntryPlaceholder")} style={{ width: "100%", padding: "12px", borderRadius: "10px", resize: "vertical", marginTop: 12, border: "1px solid #ddd" }} />

      <VoiceNoteRecorder onRecorded={setVoiceNoteUrl} />

      <button onClick={handleSave} disabled={loading} style={{ marginTop: "12px", padding: "10px 20px", cursor: loading?"not-allowed":"pointer", background: loading?"#999":"var(--accent)", color: "#000", border: "none", borderRadius: 8, opacity: loading?0.6:1, fontWeight: 700 }}>
        {loading ? t("journal.saving") : t("journal.saveEntry")}
      </button>

      <hr style={{ margin: "20px 0" }} />
      <h3>{t("journal.totalEntries", { count: entries.length })}</h3>
      {entries.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("journal.searchEntriesPlaceholder")}
          style={{ width: "100%", padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border, #ddd)", background: "transparent", color: "var(--text)", marginBottom: 14 }}
        />
      )}
      {(() => {
        const filtered = search.trim() ? entries.filter((e) => e.text.toLowerCase().includes(search.trim().toLowerCase())) : entries;
        if (entries.length === 0) return <p>{t("journal.noEntriesAtAll")}</p>;
        if (filtered.length === 0) return <p style={{ opacity: 0.6, fontSize: 13 }}>{t("journal.noEntriesMatch", { search })}</p>;
        return filtered.map((entry) => (
        <div key={entry._id} style={{ border: "1px solid var(--border, #ddd)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
          {editingId === entry._id ? (
            <>
              <textarea rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "8px" }} />
              <button onClick={() => saveEdit(entry._id)} disabled={loading} style={{ padding: "6px 14px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>{loading?t("journal.saving"):t("journal.save")}</button>
              <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ marginLeft: "10px", padding: "6px 14px", cursor: "pointer" }}>{t("journal.cancel")}</button>
            </>
          ) : (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{entry.text}</p>
              <small>{t("journal.createdLabel", { date: new Date(entry.createdAt).toLocaleString() })}</small>
              {entry.updatedAt !== entry.createdAt && <><br /><small>{t("journal.updatedLabel", { date: new Date(entry.updatedAt).toLocaleString() })}</small></>}
              <br /><br />
              <button onClick={() => startEditing(entry)} style={{ padding: "6px 12px", cursor: "pointer" }}>{t("journal.edit")}</button>
              <button onClick={() => removeEntry(entry._id)} style={{ marginLeft: "10px", padding: "6px 12px", cursor: "pointer" }}>{t("journal.delete")}</button>
            </>
          )}
        </div>
        ));
      })()}
      {entries.length > 0 && <button onClick={clearJournal} style={{ marginTop: "20px", background: "#dc2626", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "10px", cursor: "pointer" }}>{t("journal.clearJournal")}</button>}

      <SharedJournalPanel />
    </div>
  );
}
