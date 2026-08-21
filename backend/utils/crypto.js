import crypto from "crypto";

const ALGO = "aes-256-cbc";

function getKey() {
  const secret =
    process.env.ENCRYPT_KEY ||
    process.env.ENCRYPTION_SECRET ||
    "emovra-fallback-key-CHANGE-ME-IN-ENV";

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
