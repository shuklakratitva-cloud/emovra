import mongoose from "mongoose";

const privateJournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text_encrypted: { type: String, required: true },
    // Optional voice note attached to the entry, stored as an encrypted
    // base64 data URL (e.g. "data:audio/webm;base64,...."). Previously the
    // frontend recorded audio but only ever kept it in a local blob: URL
    // that vanished on reload - nothing was ever sent to the backend.
    audio_encrypted: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("PrivateJournal", privateJournalSchema);
