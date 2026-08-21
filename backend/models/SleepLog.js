import mongoose from "mongoose";

const sleepLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  bedtime: { type: String, default: "" }, // "23:30"
  wakeTime: { type: String, default: "" }, // "07:00"
  hoursSlept: { type: Number, default: null },
  quality: { type: Number, min: 1, max: 5, default: null },
  notes: { type: String, default: "" },
}, { timestamps: true });

sleepLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("SleepLog", sleepLogSchema);
