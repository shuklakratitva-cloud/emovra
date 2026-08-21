import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

export { encrypt, decrypt };

const entrySchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },

  anonId: { type: String, default: "" },

  text_encrypted: { type: String, default: "" },
  text: { type: String, select: false }, // legacy field, kept for backward compat with old docs

  riskLevel: { type: String, enum: ['GREEN','YELLOW','ORANGE','RED'], default: 'GREEN' },
  score: { type: Number, default: 0 },
  emotion: String,
  reasons: [String],

  // AI-classification fields (used by analyze.js / gemini.js via saveAnalysis.js)
  category: { type: String, default: "general" },
  abuseType: { type: String, default: "none" },
  abuseSource: { type: String, default: "none" },
  triggers: [String],

  emoAbuseDetected: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'entries'
});

entrySchema.virtual('_plainText').get(function() {
  return this.__plainText;
}).set(function(v) {
  this.__plainText = v;
});

entrySchema.pre('save', function() {
  const raw = this.__plainText || this._plainText || "";

  if (raw) {
    this.text_encrypted = encrypt(raw);

    if (this.score >= 75) this.riskLevel = 'RED';
    else if (this.score >= 45) this.riskLevel = 'ORANGE';
    else this.riskLevel = 'GREEN';

    const abuseWords = ['worthless','hate you','kill you','abuse','beating','hit me','slap','emotional abuse','gaslight'];
    this.emoAbuseDetected = abuseWords.some(w => raw.toLowerCase().includes(w));
  }
});

// Helper to decrypt when you fetch for admin panel
entrySchema.methods.getDecryptedText = function() {
  return decrypt(this.text_encrypted);
};

// NEW: auto-delete after 30 days. MongoDB's TTL index checks this in the
// background and removes documents once createdAt is older than the given
// number of seconds - no cron job, no manual cleanup script, this just
// happens on its own once the index exists.
entrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("Entry", entrySchema);
