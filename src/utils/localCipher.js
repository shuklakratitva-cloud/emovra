// src/utils/localCipher.js
//
// Obfuscates data before it's written to localStorage, for
// browser-locally-stored features (Mood Tracker, CBT reframes, Life
// Timeline, last check-in result) that were previously stored as plain,
// human-readable text.
//
// HONEST LIMITATION - read this before assuming this is equivalent to
// real encryption: the browser's actual strong-crypto API
// (crypto.subtle) is fully asynchronous, and refactoring every place
// that reads this data to use async/await would be a much larger,
// higher-risk change touching many call sites. This uses a synchronous
// XOR cipher instead, with a per-device key that's generated once and
// itself stored in localStorage. That means anyone with the technical
// know-how to find and read the key (sitting right next to the data)
// can reverse this just as easily as reading plain text - this does
// NOT protect against a determined, technically capable person with
// access to the same device.
//
// What it DOES genuinely accomplish: the data is no longer
// human-readable at a glance in DevTools' Application tab, which is the
// realistic, common threat model for this kind of local-only data (a
// sibling, parent, or friend briefly using the same device and poking
// around out of curiosity). It is not, and should not be described as,
// the same guarantee as the server-side encryption used for saved
// check-ins and Letters to Future You - those use a securely-managed
// server-side key the browser never has access to at all.

const KEY_STORAGE_NAME = "emovra_lk";

function getOrCreateKey() {
  let key = localStorage.getItem(KEY_STORAGE_NAME);
  if (!key) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(KEY_STORAGE_NAME, key);
  }
  return key;
}

function xorWithKey(str, key) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function encryptLocal(plainText) {
  try {
    const key = getOrCreateKey();
    const xored = xorWithKey(plainText, key);
    // btoa needs a byte-safe string - encodeURIComponent/unescape handles
    // the full Unicode range (emoji, Hindi text, etc.) safely.
    return btoa(unescape(encodeURIComponent(xored)));
  } catch {
    return plainText; // fail safe to plain text rather than losing data
  }
}

export function decryptLocal(cipherText) {
  try {
    const key = getOrCreateKey();
    const xored = decodeURIComponent(escape(atob(cipherText)));
    return xorWithKey(xored, key);
  } catch {
    return cipherText; // if it wasn't actually encrypted (old data), just return as-is
  }
}
