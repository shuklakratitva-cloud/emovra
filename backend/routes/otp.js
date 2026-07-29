import express from 'express';
import crypto from 'crypto';
import Otp from '../models/otp.js'; // import from model file above
import mongoose from 'mongoose';

const router = express.Router();

// SEND - Random OTP every time
router.post('/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ msg: "Phone required" });

  // Clear old OTPs so new random one is generated every time
  await Otp.deleteMany({ phone });

  const randomOtp = crypto.randomInt(100000, 999999).toString(); // RANDOM 6 digit
  console.log(`[OTP SEND] ${phone} -> ${randomOtp}`);

  await Otp.create({ phone, otp: randomOtp });

  // In prod, send SMS via Twilio/MSG91 here
  res.json({ 
    msg: "OTP sent", 
    phone,
    otp: randomOtp, // REMOVE in production, keeping for testing so you see in Network tab
    expiresIn: 300
  });
});

// VERIFY - Verify phone number
router.post('/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ verified: false, msg: "Phone + OTP required" });

  const found = await Otp.findOne({ phone, otp });
  if (!found) {
    return res.status(400).json({ verified: false, msg: "Invalid or expired OTP" });
  }

  // Verified - delete OTPs
  await Otp.deleteMany({ phone });

  // Save phone to user
  try {
    const User = mongoose.models.User;
    if (User && req.body.userId) {
      await User.findByIdAndUpdate(req.body.userId, { phone, phoneVerified: true });
    } else if (User) {
      await User.findOneAndUpdate({ email: req.body.email }, { phone, phoneVerified: true });
    }
  } catch (e) {
    console.log("User phone update skip:", e.message);
  }

  res.json({ verified: true, phone, msg: "Phone verified" });
});

export default router;
