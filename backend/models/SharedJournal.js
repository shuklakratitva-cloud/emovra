import mongoose from "mongoose";

const sharedJournalEntrySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, default: "" },
  text_encrypted: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const sharedJournalSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Our Journal" },
    inviteCode: { type: String, required: true, unique: true, index: true },

    collaborators: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String, default: "" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    entries: [sharedJournalEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.model("SharedJournal", sharedJournalSchema);
