import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, set: encrypt, get: decrypt },
  emoji: { type: String, default: "✅" },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
  completions: [{ type: String }],
  archived: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

export default mongoose.model("Habit", habitSchema);
