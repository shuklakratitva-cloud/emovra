import { ABUSE_PATTERNS } from "../data/keywords";
import { normalizeText, containsPhrase, getMatches } from "./helpers";

export function detectAbuse(text = "") {
  const normalized = normalizeText(text);
  const lower = normalized.toLowerCase();
  if (lower.includes("dont want to die") || lower.includes("do not want to die") || lower.includes("don't want to die")) {
    return { abuseDetected: false, severity: "none", matches: [], count: 0, isAbuse: false, type: "none", keywords: [] };
  }
  const abuseDetected = containsPhrase(normalized, ABUSE_PATTERNS);
  const matches = getMatches(normalized, ABUSE_PATTERNS);
  let severity = "none";
  if (matches.length >= 3) severity = "high";
  else if (matches.length >= 2) severity = "medium";
  else if (matches.length === 1) severity = "low";
  return { abuseDetected, severity, matches, count: matches.length, isAbuse: abuseDetected, type: matches[0] || "emotional abuse", keywords: matches };
}

// single declaration - no duplicate
export const analyzeAbuse = detectAbuse;

export function detectBullying(t){ return detectAbuse(t).abuseDetected; }
export function getAbuseMatches(t){ return detectAbuse(t).matches; }
export function getAbuseSeverity(t){ return detectAbuse(t).severity; }
export function getAbuseScore(t){
  const c = detectAbuse(t).count;
  if(c===0) return 0; if(c===1) return 40; if(c===2) return 70; return 100;
}
export function getAbuseColor(s){
  if(s==="high") return "#dc2626"; if(s==="medium") return "#f97316"; if(s==="low") return "#facc15"; return "#22c55e";
}
export function getAbuseEmoji(s){
  if(s==="high") return "🚨"; if(s==="medium") return "⚠"; if(s==="low") return "🟠"; return "✅";
}
export function getAbuseMessage(s){
  if(s==="high") return "Serious emotional abuse detected.";
  if(s==="medium") return "Signs of emotional abuse detected.";
  if(s==="low") return "Possible emotional abuse detected.";
  return "No abuse detected.";
}