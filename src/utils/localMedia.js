// A tiny IndexedDB store for media the person picks, kept on their own
// device and never uploaded.
//
// Why IndexedDB rather than the backend: the two things stored here are a
// calming-visual wallpaper and an app background video. Both can be large,
// and the backend keeps images as base64 inside the user's MongoDB
// document - a shape with a hard 16MB ceiling for the WHOLE document, and
// an express.json limit of 4mb in front of it. A video of any real length
// cannot go there, and object storage the app does not have would be
// needed to change that.
//
// Why not localStorage: roughly 5MB, and strings only. IndexedDB takes
// Blobs and has room for them.
const DB_NAME = "emovra_media";
const STORE = "visuals";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalMedia(key) {
  const db = await open();
  const rec = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
  db.close();
  return rec;
}

// Ask the browser to treat this origin's storage as durable.
//
// By default IndexedDB is "best-effort": a browser under storage pressure
// may evict it without asking, which for a background the person chose on
// purpose means it quietly disappears one day. Persisted storage is only
// cleared if they clear it themselves. Chrome grants this silently to a
// site the person uses; Safari and Firefox may prompt or decline, so the
// result is advisory and never blocks the save.
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function putLocalMedia(key, blob, meta = {}) {
  const db = await open();
  try {
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ blob, ...meta }, key);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function delLocalMedia(key) {
  const db = await open();
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

// How much room the browser will actually give this origin. Chrome hands
// out a share of free disk; Safari is far stingier, so a 1GB file can be
// accepted by the file picker and then refused by the quota. Checking
// first turns a silent failure into a sentence the student can act on.
export async function localMediaQuota() {
  try {
    if (!navigator.storage?.estimate) return null;
    const { quota = 0, usage = 0 } = await navigator.storage.estimate();
    return { quota, usage, free: Math.max(0, quota - usage) };
  } catch {
    return null;
  }
}

// The app background video is one blob shared across every screen, so the
// screens that render it need to hear when the settings screen changes it.
const listeners = new Set();
export function subscribeLocalMedia(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notifyLocalMedia(key) {
  listeners.forEach((fn) => { try { fn(key); } catch { /* a bad listener must not break the rest */ } });
}

export const BG_VIDEO_KEY = "backgroundVideo";
export const WALLPAPER_KEY = "wallpaper";
