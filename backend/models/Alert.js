import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    // User who triggered the alert
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Original text entered by the user
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // Emotion detected
    emotion: {
      type: String,
      default: "neutral",
    },

    // Risk Level
    riskLevel: {
      type: String,
      enum: ["GREEN", "YELLOW", "ORANGE", "RED"],
      default: "GREEN",
    },

    // Risk Score
    score: {
      type: Number,
      default: 0,
    },

    // Emergency Contact Number
    phone: {
      type: String,
      default: "",
    },

    // Current Alert Status
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

    // SOS Call Time
    calledAt: {
      type: Date,
      default: null,
    },

    // Clear Time
    clearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Alert", AlertSchema);