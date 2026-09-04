import { encryptLocal, decryptLocal } from "./localCipher.js";

// A tiny, private, local-only record of calming moments taken in the
// Sanctuary (a breathing session, a finished mini-game, a cloud tapped).
// Nothing here is sent to the backend or shown to anyone else - it just
// powers the small growing garden so effort quietly adds up over time.
const LS_KEY = "emovra_calm_garden";
const DEFAULT_STATE = { totalMinutes: 0, moments: 0, log: [] };

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    let parsed;
    try { parsed = JSON.parse(decryptLocal(raw)); }
    catch { parsed = JSON.parse(raw); }
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
function save(data) {
  try { localStorage.setItem(LS_KEY, encryptLocal(JSON.stringify(data))); } catch { /* best-effort */ }
}

const listeners = new Set();
export function subscribeCalmGarden(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(state) {
  listeners.forEach((fn) => fn(state));
}

export function getGardenState() {
  return load();
}

// Call this whenever someone finishes a calming activity. `minutes` is a
// rough, forgiving estimate of how long it took - it doesn't need to be
// precise, it's just there to make the "you took N minutes for yourself"
// message feel true.
export function recordCalmMoment(minutes = 1) {
  const data = load();
  const safeMinutes = Math.max(0.1, Math.round(minutes * 10) / 10);
  const next = {
    totalMinutes: Math.round(((data.totalMinutes || 0) + safeMinutes) * 10) / 10,
    moments: (data.moments || 0) + 1,
    log: [...(data.log || []).slice(-19), { minutes: safeMinutes, at: Date.now() }],
  };
  save(next);
  notify(next);
  return next;
}

// Purely cosmetic growth stage derived from how many calm moments have
// been logged - 0 (bare soil) through 4 (full bloom).
export function gardenStage(moments) {
  if (!moments || moments <= 0) return 0;
  if (moments < 3) return 1;
  if (moments < 7) return 2;
  if (moments < 14) return 3;
  return 4;
}
