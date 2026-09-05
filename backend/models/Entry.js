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

  // Short-lived duplicate guard - see utils/entryFingerprint.js. Not a
  // unique index on purpose: the same person writing the same words weeks
  // apart is a real, separate check-in and must still be stored. Only the
  // recent-window lookup treats a repeat as a duplicate.
  dedupHash: { type: String, default: "" },

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

    // FIX: this used to re-derive riskLevel from score unconditionally,
    // silently discarding whatever the caller set. A voice note classified
    // RED at score 60 (explicitly allowed by VOICE_PROMPT: "hopeless,
    // worthless, hit me, abuse, gaslight = ORANGE/RED 60+") was rewritten
    // to ORANGE on save, so the stored record contradicted both the server
    // log and the response the user saw, and /api/admin/reds missed it
    // (riskLevel !== "RED" and score < 75). The hook also can't produce
    // YELLOW, though the enum and the rest of the app use it. Only fill in
    // a level when the caller didn't specify one.
    //
    // Written with $isDefault() rather than isModified() because that is
    // the direct question being asked: "did the caller supply a level, or
    // is this just the schema default?" isModified() answers it correctly
    // today (Mongoose reports false for a default-applied path on a new
    // document, verified), but only as a side effect - it is about change
    // tracking for persistence, not about provenance, and routes/data.js
    // depends on getting this right: it passes no riskLevel and relies
    // entirely on the derivation below, so if that distinction ever
    // shifted, every entry saved through it would store as GREEN however
    // high the score and real ORANGE/RED check-ins would vanish from
    // /api/admin/reds.
    const callerSetRiskLevel = !this.$isDefault('riskLevel') && !!this.riskLevel;
    if (!callerSetRiskLevel) {
      if (this.score >= 75) this.riskLevel = 'RED';
      else if (this.score >= 45) this.riskLevel = 'ORANGE';
      else this.riskLevel = 'GREEN';
    }

    // FIX: this used to ASSIGN the result of the keyword scan, wiping out
    // any emoAbuseDetected the caller had already set from a real
    // classification. routes/voice.js sets it from the model's own
    // judgement and routes/data.js sets it from the reported abuseType,
    // and both were being overwritten here by a nine-word list that
    // contains "worthless" but not "useless", "nikamma", "nalayak",
    // "beizzati" or most of what school abuse actually sounds like. So a
    // correctly classified abuse report was silently downgraded to
    // emoAbuseDetected:false, which is exactly the flag /api/admin/alerts
    // and /api/admin/abuse-only use to decide whether an admin may read
    // the message. OR it in instead: keywords can only ever add a
    // detection, never erase one.
    const abuseWords = ['worthless','hate you','kill you','abuse','beating','hit me','slap','emotional abuse','gaslight'];
    if (abuseWords.some(w => raw.toLowerCase().includes(w))) this.emoAbuseDetected = true;
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
entrySchema.index({ userId: 1, createdAt: -1 });
// Sparse so the millions of pre-existing docs with no dedupHash aren't
// indexed; the duplicate lookup always supplies a real hash.
entrySchema.index({ dedupHash: 1, createdAt: -1 }, { sparse: true });
export default mongoose.model("Entry", entrySchema);
