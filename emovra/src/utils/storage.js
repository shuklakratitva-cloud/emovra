export const STORAGE_KEYS={MOOD_HISTORY:"mental_health_mood_history",JOURNAL_ENTRIES:"mental_health_journal_entries",THEME:"mental_health_theme",LAST_ANALYSIS:"mental_health_last_analysis"};
export function saveToStorage(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
export function loadFromStorage(k,d=null){try{const i=localStorage.getItem(k);if(!i)return d;return JSON.parse(i)}catch(e){return d}}
export function removeFromStorage(k){try{localStorage.removeItem(k);return true}catch(e){return false}}
export function clearAppStorage(){Object.values(STORAGE_KEYS).forEach(k=>localStorage.removeItem(k))}
export function saveMood(e){const h=loadMoodHistory();h.unshift(e);return saveToStorage(STORAGE_KEYS.MOOD_HISTORY,h)}
export function loadMoodHistory(){return loadFromStorage(STORAGE_KEYS.MOOD_HISTORY,[])}
export function deleteMoodById(id){const h=loadMoodHistory();return saveToStorage(STORAGE_KEYS.MOOD_HISTORY,h.filter(m=>m.id!==id))}
export function deleteMood(i){const h=loadMoodHistory();if(i<0||i>=h.length)return false;h.splice(i,1);return saveToStorage(STORAGE_KEYS.MOOD_HISTORY,h)}
export function saveJournalEntry(e){const j=loadJournalEntries();j.unshift(e);return saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES,j)}
export function loadJournalEntries(){return loadFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES,[])}
export function updateJournalEntry(id,u){const j=loadJournalEntries();return saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES,j.map(x=>x.id===id?{...x,...u}:x))}
export function deleteJournalEntry(id){return saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES,loadJournalEntries().filter(x=>x.id!==id))}
export function saveTheme(t){return saveToStorage(STORAGE_KEYS.THEME,t)}
export function loadTheme(){return loadFromStorage(STORAGE_KEYS.THEME,"light")}
export function saveAnalysis(r){return saveToStorage(STORAGE_KEYS.LAST_ANALYSIS,r)}
export function loadAnalysis(){return loadFromStorage(STORAGE_KEYS.LAST_ANALYSIS,null)}
