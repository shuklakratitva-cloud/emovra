import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

// re-export so existing imports like `import Entry, { decrypt } from "../models/Entry.js"` keep working
export { encrypt, decrypt };

const entrySchema = new mongoose.Schema({
  // Real logged-in user, when available. Optional now - AI-classification
  // calls (analyze.js/gemini.js) aren't always authenticated.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  // Fallback label (e.g. "anonymous" or an email) when there's no real user id.
  anonId: { type: String, default: "" },

  text_encrypted: { type: String, default: "" },
  text: { type: String, select: false }, // legacy field, kept for backward compat with old docs

  riskLevel: { type: String, enum: ['GREEN','ORANGE','RED'], default: 'GREEN' },
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

// Virtual field to hold plain text temporarily (won't be saved to DB) -
// used by the manual journal-save flow (data.js / voice.js), which sets
// entry._plainText = text before calling .save().
entrySchema.virtual('_plainText').get(function() {
  return this.__plainText;
}).set(function(v) {
  this.__plainText = v;
});

// Pre-save: ONLY runs the auto-detect logic when raw plaintext was actually
// provided via the virtual (the manual-save flow). The AI-classification
// flow (saveAnalysis.js) already computes riskLevel/emoAbuseDetected/etc
// itself and passes text_encrypted directly - this used to get silently
// overwritten by this hook recalculating against an empty string. Guarding
// on `raw` fixes that.
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

export default mongoose.model("Entry", entrySchema);
