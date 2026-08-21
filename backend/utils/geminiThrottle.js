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

  return msg.includes("timeout") || msg.includes("network") || msg.includes("econnreset") ||
         msg.includes("fetch failed") || msg.includes("503") || msg.includes("500");
}

export async function callGeminiResilient(fn) {
  if (isSelfThrottled()) {
    throw new Error("Self-throttled: near GEMINI_MAX_RPM limit, skipping call to protect quota");
  }

  try {
    const result = await fn();
    recordGeminiCall();
    return result;
  } catch (e) {
    if (!isTransientError(e)) throw e;

    await new Promise((r) => setTimeout(r, 400));
    try {
      const result = await fn();
      recordGeminiCall();
      return result;
    } catch (e2) {
      throw e2;
    }
  }
}
