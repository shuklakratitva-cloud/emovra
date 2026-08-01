import mongoose from "mongoose";

const scheduledLetterSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text_encrypted: { type: String, required: true }, // same encryption as everything else personal
    deliverOn: { type: String, required: true, index: true }, // YYYY-MM-DD
    delivered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("ScheduledLetter", scheduledLetterSchema);
