import mongoose from "mongoose";
const EntrySchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
  text: String, riskLevel: String, score: Number, emotion: String,
  reasons: [String], timestamp: {type:Date, default:Date.now}
});
export default mongoose.model("Entry", EntrySchema);