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

// The replay window, used only when the client says a write is a retry of
// something it first tried at a known moment.
//
// The 90-second window above is right for the double-write case it was
// built for, and wrong for a retry: the frontend now keeps unconfirmed
// check-ins in a local outbox and re-sends them when the network or the
// session comes back, which can be hours or days later. Judged against 90
// seconds such a replay looks brand new and would store a second copy of
// the same disclosure - doubling it in the student's history and in the
// admin counts, which is the exact bug the fingerprint was added to stop.
//
// The window is derived from the client's own timestamp rather than being
// a fixed larger constant, so it is only ever as wide as that entry
// actually is, and a client cannot use it to suppress someone else's
// writes: the fingerprint is already scoped to one user's text.
export const MAX_REPLAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function dedupCutoff(clientTs) {
  const ts = Number(clientTs);
  if (Number.isFinite(ts) && ts > 0) {
    const age = Date.now() - ts;
    if (age > 0 && age < MAX_REPLAY_WINDOW_MS) {
      // Look back to just before the client first tried, plus a minute of
      // slack for clock skew between the device and the server.
      return new Date(ts - 60 * 1000);
    }
  }
  return new Date(Date.now() - DEDUP_WINDOW_MS);
}
