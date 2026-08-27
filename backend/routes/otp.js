// NOT MOUNTED - see the comment above `app.use("/api/otp", otpRoutes)` in
// server.js. No SMS provider exists in this codebase, so /send and
// /resend below returned the OTP directly in their JSON response with no
// real out-of-band delivery, and /verify would mark a phone number
// verified with no proof it was ever received. Kept as a reference for
// building real phone verification later - do not remount without first
// removing `otp` from the response bodies below and wiring an actual SMS
// send.
import express from "express";
import crypto from "crypto";
import Otp from "../models/otp.js";
import mongoose from "mongoose";
import { protect as auth } from "../middleware/auth.js";

const router = express.Router();

const getUserModel = () => {
  try {
    return mongoose.models.User;
  } catch {
    return null;
  }
};

router.post("/send", auth, async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (!cleanPhone) return res.status(400).json({ msg: "Phone required" });
    if (cleanPhone.length < 10) return res.status(400).json({ msg: "Invalid phone" });
    const otpPurpose = purpose || "verify";

    const lastOtp = await Otp.findOne({ phone: cleanPhone, purpose: otpPurpose }).sort({
      createdAt: -1,
    });
    if (lastOtp) {
      const diff = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
      if (diff < 30) {
        return res
          .status(429)
          .json({
            msg: `Wait ${Math.ceil(30 - diff)} sec before resend`,
            retryAfter: Math.ceil(30 - diff),
          });
      }
    }

    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP SEND] ${cleanPhone} -> ${randomOtp} Purpose:${otpPurpose} - RANDOM`);
    await Otp.create({
      phone: cleanPhone,
      otp: randomOtp,
      purpose: otpPurpose,
      verified: false,
      attempts: 0,
    });
    res.json({
      msg: "OTP sent successfully",
      phone: cleanPhone,
      purpose: otpPurpose,
      otp: randomOtp,
      expiresIn: 300,
    });
  } catch (e) {
    console.log("OTP send error:", e.message, e.stack);
    res.status(500).json({ msg: "Failed to send OTP", error: e.message });
  }
});

router.post("/resend", auth, async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (!cleanPhone) return res.status(400).json({ msg: "Phone required" });
    const p = purpose || "verify";
    await Otp.deleteMany({ phone: cleanPhone, purpose: p });
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[OTP RESEND] ${cleanPhone} -> ${randomOtp}`);
    await Otp.create({
      phone: cleanPhone,
      otp: randomOtp,
      purpose: p,
      verified: false,
      attempts: 0,
    });
    res.json({ msg: "OTP resent", phone: cleanPhone, otp: randomOtp, expiresIn: 300 });
  } catch (e) {
    res.status(500).json({ msg: "Resend failed" });
  }
});

router.post("/verify", auth, async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (!cleanPhone || !otp)
      return res.status(400).json({ verified: false, msg: "Phone + OTP required" });
    const otpPurpose = purpose || "verify";
    const found = await Otp.findOne({ phone: cleanPhone, purpose: otpPurpose }).sort({
      createdAt: -1,
    });
    if (!found)
      return res.status(400).json({ verified: false, msg: "No OTP found. Please send again." });
    const age = (Date.now() - new Date(found.createdAt).getTime()) / 1000;
    if (age > 300) {
      await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
      return res.status(400).json({ verified: false, msg: "OTP expired. Request new one." });
    }
    if (found.attempts >= 5) {
      await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
      return res.status(400).json({ verified: false, msg: "Too many attempts. Request new OTP." });
    }
    if (found.otp !== otp) {
      found.attempts += 1;
      await found.save();
      return res
        .status(400)
        .json({ verified: false, msg: "Invalid OTP", attemptsLeft: 5 - found.attempts });
    }
    await Otp.deleteMany({ phone: cleanPhone, purpose: otpPurpose });
    try {
      const User = getUserModel();
      if (User) {
        // FIX: this used to also overwrite emergencyPhone with the user's
        // own just-verified number. emergencyPhone is a distinct field -
        // the SOS/crisis contact (see controllers/alertController.js,
        // routes/admin.js's "sosPhone") - set separately at signup and
        // meant to be a trusted adult, not the student's own phone. This
        // route verifies the user's own phone; it has no business touching
        // who their emergency contact is.
        await User.findByIdAndUpdate(req.userId, { phone: cleanPhone, phoneVerified: true });
      }
    } catch (e) {
      console.log("User phone update skip:", e.message);
    }
    console.log(`[OTP VERIFIED] ${cleanPhone} Purpose:${otpPurpose}`);
    res.json({
      verified: true,
      phone: cleanPhone,
      purpose: otpPurpose,
      msg: "Phone verified successfully",
    });
  } catch (e) {
    console.log("OTP verify error:", e.message, e.stack);
    res.status(500).json({ verified: false, msg: "Verification failed" });
  }
});

router.post("/send-verify-otp", auth, async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    await Otp.deleteMany({ phone: cleanPhone, purpose: "verify" });
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    await Otp.create({ phone: cleanPhone, otp: randomOtp, purpose: "verify" });
    console.log(`VERIFY OTP ${cleanPhone}: ${randomOtp}`);
    res.json({ msg: "OTP sent", phone: cleanPhone, otp: randomOtp });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

router.post("/verify-phone", auth, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (typeof phone !== "string" || typeof otp !== "string" || !phone || !otp) {
      return res.status(400).json({ verified: false, msg: "Phone and OTP required" });
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const found = await Otp.findOne({ phone: cleanPhone, otp, purpose: "verify" });
    if (!found) return res.status(400).json({ verified: false, msg: "Invalid OTP" });
    await Otp.deleteMany({ phone: cleanPhone, purpose: "verify" });
    res.json({ verified: true, phone: cleanPhone });
  } catch (e) {
    res.status(500).json({ verified: false });
  }
});

export default router;
