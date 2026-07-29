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
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // 300 sec = 5 min auto delete - this makes OTP random every time work
  }
});

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
