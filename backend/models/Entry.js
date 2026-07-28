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
  text_encrypted: { type: String },
  text: { type: String, select: false },
  riskLevel: { type: String, enum: ['GREEN','ORANGE','RED'], default: 'GREEN' },
  score: { type: Number, default: 0 },
  emotion: String,
  reasons: [String],
  emoAbuseDetected: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'entries' // <--- FIX: forces save to emotionDB.entries which you are watching in Atlas
});

// Virtual field to hold plain text temporarily (won't be saved to DB)
entrySchema.virtual('_plainText').get(function() {
  return this.__plainText;
}).set(function(v) {
  this.__plainText = v;
});

// Pre-save: FIXED - No next() needed for Mongoose 8
entrySchema.pre('save', function() {
  const raw = this.__plainText || this._plainText || "";

  // 1. Encrypt if plain text provided
  if (raw) {
    this.text_encrypted = encrypt(raw);
  }

  // 2. FIXED RISK LOGIC - your old logic was inverted, this is correct
  if (this.score >= 75) this.riskLevel = 'RED';
  else if (this.score >= 45) this.riskLevel = 'ORANGE';
  else this.riskLevel = 'GREEN';

  // 3. EMO ABUSE DETECTION - kept your feature
  const abuseWords = ['worthless','hate you','kill you','abuse','beating','hit me','slap','emotional abuse','gaslight'];
  this.emoAbuseDetected = abuseWords.some(w => raw.toLowerCase().includes(w));

  // NO next() call - Mongoose 8 will auto-continue
});

// Helper to decrypt when you fetch for admin panel
entrySchema.methods.getDecryptedText = function() {
  return decrypt(this.text_encrypted);
};

export default mongoose.model("Entry", entrySchema);