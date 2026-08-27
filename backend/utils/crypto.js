import crypto from "crypto";

const ALGO = "aes-256-cbc";

function getKey() {
  const secret = process.env.ENCRYPT_KEY || process.env.ENCRYPTION_SECRET;
  // FIX: this used to fall back to a hardcoded string
  // ("emovra-fallback-key-CHANGE-ME-IN-ENV") checked into source, so if
  // server.js's own startup guard (which currently exits the process when
  // neither env var is set) were ever loosened, refactored, or bypassed by
  // some other entry point importing this file directly, every "encrypted"
  // journal/alert/safety-plan record in the DB would silently become
  // decryptable by anyone who has read this file. Fail loudly instead of
  // silently encrypting with a known key.
  if (!secret) {
    throw new Error(
      "ENCRYPT_KEY or ENCRYPTION_SECRET must be set - refusing to encrypt/decrypt with no real key"
    );
  }

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
    if (!encText || !/^[0-9a-f]{32}:[0-9a-f]+$/i.test(encText)) return encText || "";
    const [ivHex, encrypted] = encText.split(":");
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
    let dec = decipher.update(encrypted, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return "[decryption failed]";
  }
}
