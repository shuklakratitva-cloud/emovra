import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  targetDate: { type: Date, default: null },
  milestones: [{
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  }],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Goal", goalSchema);
