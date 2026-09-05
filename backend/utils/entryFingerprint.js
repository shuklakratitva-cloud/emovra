import crypto from "crypto";

// A stable fingerprint for "this user just submitted this exact text".
//
// Why this exists: a single check-in can legitimately touch more than one
// write path. The frontend calls /api/analyze; if that is cold-starting or
// rate limited it falls back to /api/chat (backend/routes/gemini.js), and
// both of those call saveAnalysis(). The client then also has its own
// /data/save call for the paths where the server did NOT save. The client
// now signals which happened (see savedServerSide in
// src/utils/geminiAnalyzer.js), but that signal travels over the same
// flaky network that caused the fallback in the first place - if the
// response is lost after the server committed, the client cannot know it
// saved and will write the record again.
//
// So this is the last line of defence: identical text from the same user
// inside a short window collapses to one Entry. It deliberately canNOT be
// done on text_encrypted - crypto.js uses a random IV per call, so the
// same plaintext encrypts to different ciphertext every time and would
// never compare equal.
//
// The window is intentionally short. Two genuinely separate check-ins that
// are character-for-character identical within 90 seconds are far more
// likely to be one submission written twice than a real second
// disclosure, and the user's own text is never lost either way - the
// first copy is kept, only the redundant duplicate is dropped.
export const DEDUP_WINDOW_MS = 90 * 1000;

export function entryFingerprint(userLabel, text) {
  const normalizedText = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!normalizedText) return "";
  return crypto
    .createHash("sha256")
    .update(`${String(userLabel || "anonymous")}::${normalizedText}`)
    .digest("hex");
}

export function dedupCutoff() {
  return new Date(Date.now() - DEDUP_WINDOW_MS);
}
