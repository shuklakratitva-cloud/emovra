import mongoose from "mongoose";

// Deliberately separate from models/Entry.js. Entry.js exists for the
// crisis-detection pipeline (RED/ORANGE gets saved, admin can see it,
// alerts can fire). This is the opposite: a genuinely private journal - no
// AI analysis ever runs on it, no risk level, no admin visibility, nothing
// but the person's own encrypted words.

const privateJournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text_encrypted: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PrivateJournal", privateJournalSchema);
