// backend/utils/geminiThrottle.js
//
// Two things that reduce how OFTEN analyze.js/gemini.js need to fall back
// to the local keyword classifier, without ever removing that fallback:
//
// 1. Proactive self-throttling: if we're already close to your Gemini
//    quota's requests-per-minute ceiling, skip the call entirely and go
//    straight to the local fallback for THIS request, rather than firing
//    it anyway and eating a real 429 from Google (which can also trigger
//    stricter cooldowns on Google's side for repeat offenders).
//
// 2. Retry-once for TRANSIENT errors only (network blips, timeouts) - NOT
//    for quota/429 errors, since retrying a quota error immediately just
//    burns another unit of an already-exhausted quota and gets the same
//    429 back. Quota errors go straight to the existing cooldown logic in
//    analyze.js/gemini.js.
//
// Configure GEMINI_MAX_RPM in your environment to match your actual plan's
// limit (check https://aistudio.google.com/ for your tier). Defaults to a
// conservative 10/min if unset - safe for the Gemini free tier, but you
// should set this explicitly once you know your real limit.

const MAX_RPM = Number(process.env.GEMINI_MAX_RPM) || 10;
const WINDOW_MS = 60 * 1000;

let callTimestamps = [];

export function isSelfThrottled() {
  const now = Date.now();
  callTimestamps = callTimestamps.filter((t) => now - t < WINDOW_MS);
  return callTimestamps.length >= MAX_RPM;
}

export function recordGeminiCall() {
  callTimestamps.push(Date.now());
}

function isTransientError(e) {
  const msg = (e?.message || "").toLowerCase();
  // NOT transient: quota/429/rate-limit - retrying those immediately just
  // wastes another call and gets the same result.
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) return false;
  // Transient: network hiccups, timeouts, connection resets, 500/503 from Google's side.
  return msg.includes("timeout") || msg.includes("network") || msg.includes("econnreset") ||
         msg.includes("fetch failed") || msg.includes("503") || msg.includes("500");
}

/**
 * Wraps a Gemini call: checks the self-throttle first, retries once on a
 * transient failure, and records successful calls for the rate window.
 * Throws (same as calling fn() directly) if throttled or if it ultimately
 * fails - the caller's existing try/catch + fallback logic handles that
 * exactly as before, this just gives it a better shot at succeeding first.
 */
export async function callGeminiResilient(fn) {
  if (isSelfThrottled()) {
    throw new Error("Self-throttled: near GEMINI_MAX_RPM limit, skipping call to protect quota");
  }

  try {
    const result = await fn();
    recordGeminiCall();
    return result;
  } catch (e) {
    if (!isTransientError(e)) throw e; // quota errors etc - don't retry, let existing cooldown logic handle it

    // one short retry for genuinely transient failures
    await new Promise((r) => setTimeout(r, 400));
    try {
      const result = await fn();
      recordGeminiCall();
      return result;
    } catch (e2) {
      throw e2; // still failing after retry - let the normal fallback take over
    }
  }
}
