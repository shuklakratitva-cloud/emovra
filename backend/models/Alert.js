import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    // Real logged-in user, when available.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    // Fallback label when there's no real user id.
    anonId: { type: String, default: "" },

    // Encrypted at rest - always. (The old official SOS flow via
    // alertController.js used to save this as plain text, which broke your
    // "encrypted until RED/ORANGE" privacy rule - now fixed in
    // alertController.js to always encrypt before saving here.)
    text_encrypted: {
      type: String,
      default: "",
    },

    emotion: {
      type: String,
      default: "neutral",
    },

    riskLevel: {
      type: String,
      enum: ["GREEN", "YELLOW", "ORANGE", "RED"],
      default: "GREEN",
    },

    score: {
      type: Number,
      default: 0,
    },

    phone: {
      type: String,
      default: "",
    },

    // AI-classification fields
    category: { type: String, default: "general" },
    abuseType: { type: String, default: "none" },
    abuseSource: { type: String, default: "none" },
    triggers: [String],

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "CALL_INITIATED",
        "IN_PROGRESS",
        "CLEARED",
      ],
      default: "ACTIVE",
    },

    calledAt: {
      type: Date,
      default: null,
    },

    clearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// NEW: same 30-day auto-deletion as Entry.js - kept identical on purpose,
// so nothing lingers in one collection longer than the other.
AlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("Alert", AlertSchema);
