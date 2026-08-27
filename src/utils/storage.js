import { encryptLocal, decryptLocal } from "./localCipher.js";
export const STORAGE_KEYS = {
  MOOD_HISTORY: "mental_health_mood_history",
  JOURNAL_ENTRIES: "mental_health_journal_entries",
  THEME: "mental_health_theme",
  LAST_ANALYSIS: "mental_health_last_analysis",
};
// FIX: clearAppStorage() only ever covered the 4 keys above - it never
// included the other sensitive-data keys other components write directly
// (CBT worksheets, the life timeline, the plaintext check-in history, or
// the local XOR key those get "encrypted" with). Combined with the fact
// that clearAppStorage() itself was never actually called anywhere (see
// the logout fix in Auth.jsx/MindGuardApp.jsx/ThemeAvatarSettings.jsx),
// logging out left a full mood/CBT/crisis-analysis history behind
// indefinitely on shared devices. Listed here (not folded into
// STORAGE_KEYS, since those other files read/write them directly, not
// through saveToStorage/loadFromStorage) so clearAppStorage() can remove
// them too.
const EXTRA_SENSITIVE_KEYS = [
  "emovra_cbt_data",
  "emovra_life_timeline",
  "emovra_history",
  "emovra_lk",
];
export function saveToStorage(k, v) {
  try {
    localStorage.setItem(k, encryptLocal(JSON.stringify(v)));
    return true;
  } catch (e) {
    return false;
  }
}
export function loadFromStorage(k, d = null) {
  try {
    const i = localStorage.getItem(k);
    if (!i) return d;
    try {
      return JSON.parse(decryptLocal(i));
    } catch {
      return JSON.parse(i);
    } // migrate: this might be old, pre-encryption plain data
  } catch (e) {
    return d;
  }
}
export function removeFromStorage(k) {
  try {
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}
export function clearAppStorage() {
  [...Object.values(STORAGE_KEYS), ...EXTRA_SENSITIVE_KEYS].forEach((k) =>
    localStorage.removeItem(k)
  );
}
export function saveMood(e) {
  const h = loadMoodHistory();
  h.unshift(e);
  return saveToStorage(STORAGE_KEYS.MOOD_HISTORY, h);
}
export function loadMoodHistory() {
  return loadFromStorage(STORAGE_KEYS.MOOD_HISTORY, []);
}
export function deleteMoodById(id) {
  const h = loadMoodHistory();
  return saveToStorage(
    STORAGE_KEYS.MOOD_HISTORY,
    h.filter((m) => m.id !== id)
  );
}
export function deleteMood(i) {
  const h = loadMoodHistory();
  if (i < 0 || i >= h.length) return false;
  h.splice(i, 1);
  return saveToStorage(STORAGE_KEYS.MOOD_HISTORY, h);
}
export function saveJournalEntry(e) {
  const j = loadJournalEntries();
  j.unshift(e);
  return saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, j);
}
export function loadJournalEntries() {
  return loadFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, []);
}
export function updateJournalEntry(id, u) {
  const j = loadJournalEntries();
  return saveToStorage(
    STORAGE_KEYS.JOURNAL_ENTRIES,
    j.map((x) => (x.id === id ? { ...x, ...u } : x))
  );
}
export function deleteJournalEntry(id) {
  return saveToStorage(
    STORAGE_KEYS.JOURNAL_ENTRIES,
    loadJournalEntries().filter((x) => x.id !== id)
  );
}
export function saveTheme(t) {
  return saveToStorage(STORAGE_KEYS.THEME, t);
}
export function loadTheme() {
  return loadFromStorage(STORAGE_KEYS.THEME, "light");
}
export function saveAnalysis(r) {
  return saveToStorage(STORAGE_KEYS.LAST_ANALYSIS, r);
}
export function loadAnalysis() {
  return loadFromStorage(STORAGE_KEYS.LAST_ANALYSIS, null);
}
