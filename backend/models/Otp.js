import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true,
    index: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  // ADDED for your auth.js which uses purpose: 'verify' / 'reset'
  purpose: {
    type: String,
    enum: ['verify', 'reset'],
    default: 'verify',
    index: true
  },
  // ADDED to fix your screenshot phone:"" and track verification
  verified: {
    type: Boolean,
    default: false
  },
  // ADDED to count attempts if needed
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // 300 sec = 5 min auto delete - this makes OTP random every time work
  }
});

// For faster random OTP every time lookup
otpSchema.index({ phone: 1, purpose: 1 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
