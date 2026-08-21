import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    anonId: { type: String, default: "" },

    // Encrypted at rest - always. (The old official SOS flow via
    // alertController.js used to save this as plain text, which broke your
    // "encrypted until RED/ORANGE" privacy rule - now fixed in

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

AlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("Alert", AlertSchema);
