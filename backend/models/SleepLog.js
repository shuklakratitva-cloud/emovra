import mongoose from "mongoose";

const sleepLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD" - the morning you logged it
  bedtime: { type: String, default: "" }, // "23:30"
  wakeTime: { type: String, default: "" }, // "07:00"
  hoursSlept: { type: Number, default: null },
  quality: { type: Number, min: 1, max: 5, default: null }, // self-rated 1-5
  notes: { type: String, default: "" },
}, { timestamps: true });

sleepLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("SleepLog", sleepLogSchema);
