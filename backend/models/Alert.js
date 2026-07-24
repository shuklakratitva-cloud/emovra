const mongoose = require("mongoose");
const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  age: Number,
  emergencyPhone: String,
  text: String,
  riskLevel: { type: String, default: "RED" },
  score: Number,
  reasons: [String],
  ip: String,
  timestamp: { type: Date, default: Date.now },
  cleared: { type: Boolean, default: false }
});
module.exports = mongoose.model("Alert", alertSchema);