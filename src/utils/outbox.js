import { encryptLocal, decryptLocal } from "./localCipher.js";
import { API_BASE as API } from "../config/api.js";

// A durable queue for check-ins that have not been confirmed stored.
//
// WHY THIS EXISTS. saveToBackend() was fire-and-forget: the request was
// launched, setInputText("") wiped the student's words from the screen in
// the same breath, and nothing ever looked back. Three things then each
// destroyed check-ins outright:
//
//   1. The request was still in flight when the person moved on. Closing
//      the tab or navigating cancels it. The backend runs on Render's free
//      tier, which sleeps after inactivity and takes the better part of a
//      minute to wake, so that window is enormous rather than theoretical.
//   2. The JWT lasts 20 days and there is no refresh token, while the app
//      decides you are logged in from localStorage alone. Past 20 days a
//      student still looked signed in and every single check-in 401'd.
//   3. An ordinary dropped connection.
//
// A banner telling someone their entry failed is not a fix - they wrote
// something down in a bad moment and it is gone either way. So the entry
// is written here FIRST, and only removed once the server says it stored
// it. Anything still here gets retried.
//
// Encrypted on disk with the same localCipher the calm garden uses: this
// queue holds exactly the text a student typed during a rough moment, and
// it may sit on a shared or school machine for days.
const KEY = "emovra_outbox";
const MAX_ITEMS = 60;
const MAX_ATTEMPTS = 10;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    let parsed;
    try { parsed = JSON.parse(decryptLocal(raw)); }
    catch { parsed = JSON.parse(raw); }      // pre-encryption queues
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, encryptLocal(JSON.stringify(items)));
  } catch {
    // Storage full or blocked. Nothing useful to do; the in-flight request
    // may still succeed.
  }
}

function fresh(items) {
  const now = Date.now();
  return items.filter((i) => now - i.createdAt < MAX_AGE_MS && i.attempts < MAX_ATTEMPTS);
}

export function pendingCount() {
  return fresh(read()).length;
}

// Called BEFORE the network attempt, so an entry exists on disk even if the
// tab closes mid-request.
export function enqueue(entry) {
  const items = fresh(read());
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entry,
    createdAt: Date.now(),
    attempts: 0,
  };
  items.push(item);
  // Oldest out first if somehow flooded.
  write(items.slice(-MAX_ITEMS));
  return item.id;
}

export function resolve(id) {
  write(read().filter((i) => i.id !== id));
}

function bumpAttempt(id) {
  write(read().map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1 } : i)));
}

// Send one queued entry. `clientTs` tells the server this is a replay of
// something first written at that moment, so its duplicate check can look
// back that far instead of the usual 90 seconds.
async function send(item, token) {
  const res = await fetch(`${API}/data/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...item.entry, clientTs: item.createdAt }),
  });
  return res;
}

// Returns { sent, expired } - `expired` meaning the token is dead and there
// is no point trying the rest until the person signs in again.
export async function flush() {
  const token = localStorage.getItem("token");
  if (!token) return { sent: 0, expired: false };

  const items = fresh(read());
  write(items);                       // prune aged-out entries while here
  let sent = 0;

  for (const item of items) {
    try {
      const res = await send(item, token);
      if (res.status === 401 || res.status === 403) {
        return { sent, expired: true };
      }
      if (res.ok) {
        resolve(item.id);
        sent += 1;
      } else {
        bumpAttempt(item.id);
      }
    } catch {
      bumpAttempt(item.id);           // still offline; keep it for next time
      break;
    }
  }
  return { sent, expired: false };
}

// Retry whenever there is a reason to think it might work now.
export function startOutbox(onChange) {
  let running = false;
  const run = async () => {
    if (running || document.hidden || !navigator.onLine) return;
    if (!pendingCount()) return;
    running = true;
    try {
      const r = await flush();
      onChange?.(r);
    } finally {
      running = false;
    }
  };

  run();
  const onFocus = () => run();
  const id = setInterval(run, 60000);
  window.addEventListener("online", onFocus);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onFocus);
  return () => {
    clearInterval(id);
    window.removeEventListener("online", onFocus);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onFocus);
  };
}
