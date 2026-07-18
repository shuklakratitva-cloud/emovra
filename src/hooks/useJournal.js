// src/hooks/useJournal.js

import { useState, useEffect } from "react";
import {
  saveJournalEntry,
  loadJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
} from "../utils/storage";
import { generateId } from "../utils/helpers";

export default function useJournal() {
  const [entries, setEntries] = useState([]);
  const [journalText, setJournalText] = useState("");

  useEffect(() => {
    setEntries(loadJournalEntries());
  }, []);

  function addEntry(text) {
    if (!text.trim()) return;
    const newEntry = {
      id: generateId(),
      text: text.trim(),
      timestamp: Date.now(),
    };
    saveJournalEntry(newEntry);
    setEntries(loadJournalEntries());
    setJournalText("");
  }

  function editEntry(id, newText) {
    if (!newText.trim()) return;
    updateJournalEntry(id, {
      text: newText.trim(),
      updatedAt: Date.now(),
    });
    setEntries(loadJournalEntries());
  }

  function removeEntry(id) {
    deleteJournalEntry(id);
    setEntries(loadJournalEntries());
  }

  function clearJournal() {
    localStorage.removeItem("mental_health_journal_entries");
    setEntries([]);
  }

  function searchEntries(keyword) {
    if (!keyword.trim()) return entries;
    return entries.filter((entry) =>
      entry.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  const totalEntries = entries.length;

  return {
    journalText,
    setJournalText,
    entries,
    totalEntries,
    addEntry,
    editEntry,
    removeEntry,
    clearJournal,
    searchEntries,
  };
}