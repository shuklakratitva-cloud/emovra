import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['verify', 'reset'], default: 'verify' },
  email: { type: String }, // keep for backward compatibility
  createdAt: { type: Date, default: Date.now, expires: 600 } // auto delete after 10 mins
});

export default mongoose.model("Otp", otpSchema);