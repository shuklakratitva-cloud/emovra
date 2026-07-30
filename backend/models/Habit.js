import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  emoji: { type: String, default: "✅" },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
  completions: [{ type: String }], // array of "YYYY-MM-DD" dates completed
  archived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Habit", habitSchema);
