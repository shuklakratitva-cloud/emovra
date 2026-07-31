// utils/crypto.js
// SINGLE SOURCE OF TRUTH for encryption. Previously Entry.js, analyze.js, and
// gemini.js each had their own encrypt/decrypt with different key derivation,
// meaning text encrypted by one route often couldn't be decrypted by another
// (e.g. admin.js calling Entry.js's decrypt() on text encrypted by analyze.js).
// Everything now imports encrypt/decrypt from here.

import crypto from "crypto";

const ALGO = "aes-256-cbc";

function getKey() {
  const secret =
    process.env.ENCRYPT_KEY ||
    process.env.ENCRYPTION_SECRET ||
    "emovra-fallback-key-CHANGE-ME-IN-ENV";
  // scrypt turns any-length passphrase into a proper 32-byte key.
  // (analyze.js/gemini.js used to do key.slice(0,32).padEnd(32,'0') which is
  // much weaker and produced a DIFFERENT key than this derivation.)
  return crypto.scryptSync(secret, "emovra-salt", 32);
}

export function encrypt(text) {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
    let enc = cipher.update(String(text), "utf8", "hex");
    enc += cipher.final("hex");
    return iv.toString("hex") + ":" + enc;
  } catch (e) {
    console.error("Encrypt error:", e.message);
    return "";
  }
}

export function decrypt(encText) {
  try {
    if (!encText || !encText.includes(":")) return encText || "";
    const [ivHex, encrypted] = encText.split(":");
    const decipher = crypto.createDecipheriv(
      ALGO,
      getKey(),
      Buffer.from(ivHex, "hex")
    );
    let dec = decipher.update(encrypted, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return "[decryption failed]";
  }
}
