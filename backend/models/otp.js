import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['verify', 'reset'],
    default: 'verify',
    index: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300
  }
});

otpSchema.index({ phone: 1, purpose: 1 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
