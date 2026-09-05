import { API_BASE as API } from "../config/api.js";

// FIX: the backend's /api/chat (backend/routes/gemini.js) calls
// saveAnalysis() itself, so any call that reaches it already persists a
// RED/ORANGE Entry server-side. Two consequences, both previously wrong:
//
//   1. These fetches sent NO Authorization header, so optionalAuth left
//      req.user undefined and the route fell back to userId "anonymous".
//      The Entry was written with userId:null / anonId:"anonymous" -
//      orphaned from the student who actually wrote it. It never appeared
//      in their own history, account deletion (which deletes by userId)
//      could never remove it, and it polluted admin stats as an
//      unattributable anonymous crisis record.
//
//   2. The caller (MindGuardApp.handleAnalyze) had no way to know the
//      server had already saved, so it went on to call /data/save and
//      wrote a SECOND Entry for the same disclosure - doubling the user's
//      mood history, the admin counts, and the early-warning trigger that
//      watches for repeated flags. For school abuse it also POSTed
//      /alerts/red, producing a second Alert row on top of the one
//      saveAnalysis() had already created.
//
// authHeaders() fixes (1). The `savedServerSide` flag on every returned
// object fixes (2) - it is true only on the paths where the request
// actually reached the backend and came back clean.
function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage can throw in private/blocked-storage modes - fall
    // through unauthenticated rather than failing the analysis.
  }
  return headers;
}

export async function analyzeWithGemini(text, toneData = null) {
  const lower = text.toLowerCase().trim();
  const violence = ["kill","murder","stab","shoot","hurt him","hurt her","kill him","kill her","want to kill","gonna kill","i will kill","choke","beat him","slit"];
  const abuseList = [
    "fuck","fucking","motherfucker","mf","bitch","bastard","asshole","madarchod","behenchod","bhenchod","chutiya","gandu","lodu","harami","kamine","kutta","kutte","randi","saala","saali","mc","bc","lavde","bsdk","bhadwa","chud","gaand","gand","chut","lund"
  ];
  if (violence.some(k => lower.includes(k))) {
    return {
      level: "RED", riskLevel: "RED", score: 98,
      emotion: "angry", sentiment: "negative",
      reasons: ["violence / homicidal intent detected"],
      advice: "Intense anger detected. Stop. Breathe. Do not act. Step away and talk to someone now.",
      isCrisis: true,
      helpline: "Tele-MANAS 14416 | If you may act, call 112",
      source: "force-RED-violence",
      // Purely local - no request was made, so nothing is persisted yet.
      savedServerSide: false
    };
  }
   const foundAbuse = abuseList.filter(w => lower.includes(w));
  if (foundAbuse.length > 0) {
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ message: text, toneData })
      });
      const data = await res.json();
      let forcedScore = foundAbuse.length >= 3 ? 65 : foundAbuse.length >=2 ? 50 : 35;
      if (lower === lower.toUpperCase() && lower.length > 5) forcedScore += 10;
      const finalScore = Math.max(data.score || 0, forcedScore);
      let finalLevel = data.riskLevel || data.level || "ORANGE";
      if (finalScore >= 70) finalLevel = "RED";
      else if (finalScore >= 45) finalLevel = "ORANGE";
      else finalLevel = "ORANGE";
      return {
        level: finalLevel, riskLevel: finalLevel,
        score: finalScore,
        emotion: data.emotion || "angry",
        sentiment: "negative",
        reasons: [`abusive language detected: ${foundAbuse.slice(0,3).join(", ")}`, ...(data.reasons||[])],
        advice: data.reply || "Abuse shows high stress/anger. Try pausing, breathing 4-4-4-4, and rephrasing your feelings without slurs.",
        isCrisis: finalLevel === "RED",
        source: "abuse-forced-" + forcedScore,
        // The request reached /api/chat, which ran saveAnalysis() on the
        // level IT computed. Note this is keyed off the server's own
        // classification, not the locally-escalated finalLevel above: if
        // the server said GREEN it saved nothing, and the client still
        // needs to persist the escalated result itself.
        savedServerSide: !data.error &&
          ["RED", "ORANGE"].includes(String(data.riskLevel || "").toUpperCase())
      };
    } catch {
      const score = foundAbuse.length >=2 ? 55 : 35;
      return {
        level: score >=45 ? "ORANGE" : "ORANGE", riskLevel: score >=45 ? "ORANGE" : "ORANGE",
        score: score, emotion: "angry", sentiment: "negative",
        reasons: [`abusive language: ${foundAbuse.join(", ")}`],
        advice: "High anger/abuse detected. Take a break, breathe, avoid acting while angry.",
        isCrisis: false, source: "client-abuse-force",
        // The request failed - nothing reached the server.
        savedServerSide: false
      };
    }
  }
   try {
    const res = await fetch(`${API}/chat`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ message: text, toneData })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      level: data.riskLevel, riskLevel: data.riskLevel,
      score: data.score,
      emotion: data.emotion,
      sentiment: data.riskLevel === "RED" || data.riskLevel === "ORANGE" ? "negative" : "neutral",
      reasons: data.triggers || [],
      advice: data.reply,
      isCrisis: data.riskLevel === "RED",
      helpline: data.riskLevel === "RED" ? "Tele-MANAS: 14416 | Kiran: 1800-599-0019" : null,
      source: "gemini-chat",
      // saveAnalysis() only writes RED/ORANGE (GREEN is deliberately not
      // stored - see the PRIVACY-SKIP branch in backend/utils/saveAnalysis.js),
      // so only claim a server-side save for those two levels.
      savedServerSide: ["RED", "ORANGE"].includes(String(data.riskLevel || "").toUpperCase()),
    };
  } catch (e) {
    // FIX: this used to swallow the failure and return a flat ORANGE/30.
    // Because it never threw, the caller's catch in MindGuardApp - which
    // runs the local analyzeRisk() safety net covering indirect ideation
    // ("no one would notice if I disappeared", "better off without me",
    // "I'm a burden", "wish I was dead") - was dead code that could never
    // execute. The result: whenever the backend was cold-starting or rate
    // limited, a message that analyzeRisk() would have scored RED was
    // shown to the student as ORANGE, with no Kiran helpline and no SOS
    // emergency-contact button (RiskCard gates both on isRed). Rethrow so
    // the local safety net actually gets its turn.
    throw new Error(`AI unavailable: ${e?.message || "network error"}`, { cause: e });
  }
}
