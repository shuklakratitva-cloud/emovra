import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, set: encrypt, get: decrypt },
  targetDate: { type: Date, default: null },
  milestones: [{
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  }],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  xpAwarded: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

export default mongoose.model("Goal", goalSchema);
