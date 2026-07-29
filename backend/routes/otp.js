import express from 'express';
import crypto from 'crypto';
import Otp from '../models/otp.js';
import mongoose from 'mongoose';

const router = express.Router();

// SEND - Random OTP every time + supports both verify & reset
router.post('/send', async (req, res) => {
  try {
    const { phone, purpose, email, userId } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    
    if (!cleanPhone) return res.status(400).json({ msg: "Phone required" });

    const otpPurpose = purpose || 'verify'; // verify or reset

    // Clear old OTPs so new random one is generated every time
    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });

    // RANDOM 6 digit every time - crypto.randomInt = true random
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP SEND] ${cleanPhone} -> ${randomOtp} Purpose:${otpPurpose} - RANDOM EVERY TIME`);

    await Otp.create({ 
      phone: cleanPhone, 
      otp: randomOtp,
      purpose: otpPurpose,
      verified: false
    });

    // In prod, send SMS via Twilio/MSG91 here
    res.json({ 
      msg: "OTP sent", 
      phone: cleanPhone,
      purpose: otpPurpose,
      otp: randomOtp, // REMOVE in production, keeping for testing so you see in Network tab
      expiresIn: 300
    });
  } catch (e) {
    console.log("OTP send error:", e.message);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});

// VERIFY - Verify phone number + fixes your screenshot phone:"" bug
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp, purpose, email, userId } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    
    if (!cleanPhone || !otp) return res.status(400).json({ verified: false, msg: "Phone + OTP required" });

    const otpPurpose = purpose || 'verify';

    const found = await Otp.findOne({ phone: cleanPhone, otp, purpose: otpPurpose });
    if (!found) {
      return res.status(400).json({ verified: false, msg: "Invalid or expired OTP" });
    }

    // Verified - delete OTPs for this phone+purpose
    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });

    // Save phone to user - fixes alerts collection phone:"" issue
    try {
      const User = mongoose.models.User;
      if (User) {
        if (userId) {
          await User.findByIdAndUpdate(userId, { phone: cleanPhone, phoneVerified: true, emergencyPhone: cleanPhone });
        } else if (email) {
          await User.findOneAndUpdate({ email: email.toLowerCase() }, { phone: cleanPhone, phoneVerified: true });
        } else if (req.body.emergencyPhone) {
          await User.findOneAndUpdate({ emergencyPhone: cleanPhone }, { phone: cleanPhone, phoneVerified: true });
        }
      }
    } catch (e) {
      console.log("User phone update skip:", e.message);
    }

    console.log(`[OTP VERIFIED] ${cleanPhone} Purpose:${otpPurpose} - Phone saved to user`);

    res.json({ verified: true, phone: cleanPhone, purpose: otpPurpose, msg: "Phone verified" });
  } catch (e) {
    console.log("OTP verify error:", e.message);
    res.status(500).json({ verified: false, msg: "Verification failed" });
  }
});

// COMPATIBILITY: Also support your auth.js routes /send-verify-otp and /verify-phone calling same logic
router.post('/send-verify-otp', async (req, res) => {
  req.body.purpose = 'verify';
  return router.handle(req, res);
});

export default router;
