import mongoose from "mongoose";

const safetyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    warningSigns_encrypted: { type: String, default: "" },
    copingStrategies_encrypted: { type: String, default: "" },
    supportContacts_encrypted: { type: String, default: "" },
    reasonsToLive_encrypted: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SafetyPlan", safetyPlanSchema);
