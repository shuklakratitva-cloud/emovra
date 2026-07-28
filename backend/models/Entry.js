import mongoose from "mongoose";
import crypto from "crypto";

const ALGO = 'aes-256-cbc';
const getKey = () => {
  const secret = process.env.ENCRYPTION_SECRET || 'fallback-emovra-key-change-me-32';
  return crypto.scryptSync(secret, 'emovra-salt', 32);
};

export const encrypt = (text) => {
  if(!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
};

export const decrypt = (encText) => {
  try {
    if(!encText ||!encText.includes(':')) return encText;
    const [ivHex, encrypted] = encText.split(':');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
    let dec = decipher.update(encrypted, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch { return "[decryption failed]"; }
};

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text_encrypted: { type: String }, // encrypted, you can't read in Atlas
  text: { type: String, select: false }, // old field, keep but hide
  riskLevel: { type: String, enum: ['GREEN','ORANGE','RED'], default: 'GREEN' },
  score: { type: Number, default: 0 },
  emotion: String,
  reasons: [String],
  emoAbuseDetected: { type: Boolean, default: false }, // NEW SEPARATE INDICATOR
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save: Fix your GREEN/ORANGE bug + encrypt
entrySchema.pre('save', function(next) {
  // If plain text provided, encrypt it
  if (this._plainText) {
    this.text_encrypted = encrypt(this._plainText);
  }
  // FIXED RISK LOGIC - your old logic was inverted
  if (this.score >= 75) this.riskLevel = 'RED';
  else if (this.score >= 45) this.riskLevel = 'ORANGE';
  else this.riskLevel = 'GREEN';

  // EMO ABUSE DETECTION
  const raw = this._plainText || "";
  const abuseWords = ['worthless','hate you','kill you','abuse','beating','hit me','slap','emotional abuse','gaslight'];
  this.emoAbuseDetected = abuseWords.some(w => raw.toLowerCase().includes(w));

  next();
});

export default mongoose.model("Entry", entrySchema);