import express from 'express';
import crypto from 'crypto';
import Otp from '../models/otp.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to get User model safely
const getUserModel = () => {
  try { return mongoose.models.User; } 
  catch { return null; }
}

// SEND - Random OTP every time + purpose support + attempt tracking
router.post('/send', async (req, res) => {
  try {
    const { phone, purpose, email } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    
    if (!cleanPhone) return res.status(400).json({ msg: "Phone required" });
    if (cleanPhone.length < 10) return res.status(400).json({ msg: "Invalid phone" });

    const otpPurpose = purpose || 'verify';

    // Rate limit: check if last OTP was sent < 30 sec ago
    const lastOtp = await Otp.findOne({ phone: cleanPhone, purpose: otpPurpose }).sort({ createdAt: -1 });
    if (lastOtp) {
      const diff = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
      if (diff < 30) {
        return res.status(429).json({ msg: `Wait ${Math.ceil(30-diff)} sec before resend`, retryAfter: Math.ceil(30-diff) });
      }
    }

    // Clear old OTPs so new RANDOM one is generated every time
    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });

    // TRUE RANDOM - crypto.randomInt = new random every time
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP SEND] ${cleanPhone} -> ${randomOtp} Purpose:${otpPurpose} - RANDOM`);

    await Otp.create({ 
      phone: cleanPhone, 
      otp: randomOtp,
      purpose: otpPurpose,
      verified: false,
      attempts: 0
    });

    res.json({ 
      msg: "OTP sent successfully", 
      phone: cleanPhone,
      purpose: otpPurpose,
      otp: randomOtp, // REMOVE in production, keep for testing
      expiresIn: 300
    });
  } catch (e) {
    console.log("OTP send error:", e.message, e.stack);
    res.status(500).json({ msg: "Failed to send OTP", error: e.message });
  }
});

// RESEND - alias for send
router.post('/resend', async (req, res) => {
  req.body.purpose = req.body.purpose || 'verify';
  // forward to send logic
  try {
    const { phone, purpose } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (!cleanPhone) return res.status(400).json({ msg: "Phone required" });
    await Otp.deleteMany({ phone: cleanPhone, purpose: purpose || 'verify' });
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP RESEND] ${cleanPhone} -> ${randomOtp}`);
    await Otp.create({ phone: cleanPhone, otp: randomOtp, purpose: purpose || 'verify', verified: false, attempts: 0 });
    res.json({ msg: "OTP resent", phone: cleanPhone, otp: randomOtp, expiresIn: 300 });
  } catch (e) {
    res.status(500).json({ msg: "Resend failed" });
  }
});

// VERIFY - with expiry, attempts, phone save fix
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp, purpose, email, userId } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    
    if (!cleanPhone || !otp) return res.status(400).json({ verified: false, msg: "Phone + OTP required" });

    const otpPurpose = purpose || 'verify';

    const found = await Otp.findOne({ phone: cleanPhone, purpose: otpPurpose }).sort({ createdAt: -1 });
    if (!found) {
      return res.status(400).json({ verified: false, msg: "No OTP found. Please send again." });
    }

    // Expiry check - 5 min
    const age = (Date.now() - new Date(found.createdAt).getTime()) / 1000;
    if (age > 300) {
      await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
      return res.status(400).json({ verified: false, msg: "OTP expired. Request new one." });
    }

    // Attempt limit
    if (found.attempts >= 5) {
      await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
      return res.status(400).json({ verified: false, msg: "Too many attempts. Request new OTP." });
    }

    if (found.otp !== otp) {
      found.attempts += 1;
      await found.save();
      return res.status(400).json({ verified: false, msg: "Invalid OTP", attemptsLeft: 5 - found.attempts });
    }

    // Success - delete all OTPs
    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });

    // FIX your phone:"" bug - save to User
    try {
      const User = getUserModel();
      if (User) {
        if (userId) {
          await User.findByIdAndUpdate(userId, { phone: cleanPhone, phoneVerified: true, emergencyPhone: cleanPhone });
        } else if (email) {
          await User.findOneAndUpdate({ email: email.toLowerCase() }, { phone: cleanPhone, phoneVerified: true });
        }
      }
    } catch (e) {
      console.log("User phone update skip:", e.message);
    }

    console.log(`[OTP VERIFIED] ${cleanPhone} Purpose:${otpPurpose}`);
    res.json({ verified: true, phone: cleanPhone, purpose: otpPurpose, msg: "Phone verified successfully" });
  } catch (e) {
    console.log("OTP verify error:", e.message, e.stack);
    res.status(500).json({ verified: false, msg: "Verification failed" });
  }
});

// Compatibility routes for your auth.js
router.post('/send-verify-otp', (req, res, next) => {
  req.body.purpose = 'verify';
  next();
}, async (req, res) => {
  // call send handler again
  const { phone } = req.body;
  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  await Otp.deleteMany({ phone: cleanPhone, purpose: 'verify' });
  const randomOtp = crypto.randomInt(100000, 999999).toString();
  await Otp.create({ phone: cleanPhone, otp: randomOtp, purpose: 'verify' });
  res.json({ msg: "OTP sent", phone: cleanPhone, otp: randomOtp });
});

router.post('/verify-phone', async (req, res) => {
  req.body.purpose = 'verify';
  // reuse verify logic
  const { phone, otp } = req.body;
  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  const found = await Otp.findOne({ phone: cleanPhone, otp, purpose: 'verify' });
  if (!found) return res.status(400).json({ verified: false });
  await Otp.deleteMany({ phone: cleanPhone, purpose: 'verify' });
  res.json({ verified: true, phone: cleanPhone });
});

export default router;
