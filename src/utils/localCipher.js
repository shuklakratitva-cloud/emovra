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
    return btoa(unescape(encodeURIComponent(xored)));
  } catch {
    return plainText; 
  }
}
export function decryptLocal(cipherText) {
  try {
    const key = getOrCreateKey();
    const xored = decodeURIComponent(escape(atob(cipherText)));
    return xorWithKey(xored, key);
  } catch {
    return cipherText; 
  }
}
