import mongoose from "mongoose";

const privateJournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text_encrypted: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PrivateJournal", privateJournalSchema);
