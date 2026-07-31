import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  // NEW: phone is now optional, email added - one or the other is used
  // depending on purpose. Email is now used for password-reset OTPs
  // (routes/auth.js) since that actually gets delivered (real email);
  // phone-based OTP verification was scrapped - it never sent real SMS.
  phone: { type: String, index: true, default: "" },
  email: { type: String, index: true, default: "", lowercase: true, trim: true },
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
otpSchema.index({ email: 1, purpose: 1 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
