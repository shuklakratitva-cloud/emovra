
// src/utils/helpers.js - FIXED for don't / dont
export function normalizeText(text=""){
  return (text||"").toLowerCase()
    .replace(/['’]/g, "")  // don't -> dont, i'd -> id  (remove apostrophe, don't add space)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function containsPhrase(text, phrases=[]){
  const n = normalizeText(text);
  if(!n) return false;
  const padded = ` ${n} `;
  return phrases.some(p=>{
    const pn = normalizeText(p);
    if(!pn) return false;
    return padded.includes(` ${pn} `);
  });
}
export function countMatches(text, words=[]){
  const n = normalizeText(text);
  if(!n) return 0;
  const padded = ` ${n} `;
  let c=0;
  for(const w of words){
    const pn = normalizeText(w);
    if(!pn) continue;
    if(padded.includes(` ${pn} `)) c++;
  }
  return c;
}
export function getMatches(text, words=[]){
  const n = normalizeText(text);
  if(!n) return [];
  const padded = ` ${n} `;
  return words.filter(w=>{
    const pn = normalizeText(w);
    return pn && padded.includes(` ${pn} `);
  });
}
export function clamp(v,min=0,max=100){ return Math.min(Math.max(v,min),max); }
export function formatTimestamp(ts){ return new Date(ts).toLocaleString(); }
export function generateId(){ return Date.now().toString(36)+Math.random().toString(36).substring(2,8); }
export function isEmpty(t=""){ return !t || !t.trim(); }
