import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Otp from "../models/otp.js";

const router = express.Router();

async function handleSignup(req, res) {
  try {
    let { name, email, password, age, emergencyName, emergencyPhone, countryCode, legalConsent } = req.body;
    console.log("Signup attempt:", email);

    name = name?.trim();
    email = email?.trim().toLowerCase();
    emergencyName = emergencyName?.trim() || "";
    emergencyPhone = emergencyPhone?.trim();
    countryCode = countryCode?.trim() || "+91";

    if (!legalConsent?.given) {
      return res.status(400).json({ msg: "You must accept Privacy Policy and Terms" });
    }
    if (!name ||!email ||!password ||!age) {
      return res.status(400).json({ msg: "Name, email, password, age required" });
    }
    if (!emergencyPhone) {
      return res.status(400).json({ msg: "Emergency phone is compulsory" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists, please login" });

    const hashed = await bcrypt.hash(password, 10);

    let role = "user";
    if (email === "kratitvashukla14@mindguard.local" || email === "kratitvashhukla12@mindguard.local") {
      role = "admin";
    }

    const user = await User.create({
      name,
      email,
      password: hashed,
      age: Number(age),
      emergencyName,
      emergencyPhone: emergencyPhone.replace(/\D/g, ""),
      countryCode,
      role,
      phoneVerified: false,
      legalConsent: {
        given: true,
        type: legalConsent?.type || "all",
        timestamp: new Date(),
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
        userAgent: req.headers["user-agent"],
        consentVersion: "v1.0 - 26 July 2026",
        consentText: legalConsent?.consentText || "User accepted Terms & Privacy"
      }
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role, phoneVerified: user.phoneVerified }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ msg: err.message });
  }
}

router.post("/signup", handleSignup);
router.post("/register", handleSignup);

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role || "user", phoneVerified: user.phoneVerified || false } });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// --- NEW: MOBILE VERIFICATION + FORGOT PASSWORD - RANDOM EVERY TIME ---

router.post('/send-verify-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: "Phone required" });
    const cleanPhone = phone.replace(/\D/g, "");

    // RANDOM EVERY TIME - using crypto for true randomness
    const otp = crypto.randomInt(100000, 999999).toString();

    // Delete old so new random is generated every time
    await Otp.deleteMany({ phone: cleanPhone, purpose: 'verify' });
    await Otp.create({ phone: cleanPhone, otp, purpose: 'verify' });

    console.log(`VERIFY OTP ${cleanPhone}: ${otp} - RANDOM EVERY TIME`);
    res.json({ success: true, message: "OTP sent - check Render Logs", phone: cleanPhone, otp: otp });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/verify-phone', async (req, res) => {
  try {
    const { phone, otp, email } = req.body;
    const cleanPhone = phone.replace(/\D/g, "");
    const found = await Otp.findOne({ phone: cleanPhone, otp, purpose: 'verify' });
    if (!found) return res.status(400).json({ verified: false, msg: "Invalid OTP" });

    await Otp.deleteMany({ phone: cleanPhone, purpose: 'verify' });

    if (email) {
      await User.findOneAndUpdate({ email: email.toLowerCase() }, { phoneVerified: true, phone: cleanPhone });
    } else if (req.body.userId) {
      await User.findByIdAndUpdate(req.body.userId, { phoneVerified: true, phone: cleanPhone });
    }

    console.log(`[PHONE VERIFIED] ${cleanPhone}`);
    res.json({ verified: true, phone: cleanPhone, msg: "Phone verified successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/forgot-password/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: "Phone required" });
    const cleanPhone = phone.replace(/\D/g, "");
    const user = await User.findOne({ emergencyPhone: cleanPhone });
    if (!user) return res.status(404).json({ msg: "No user with this phone number" });

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ phone: cleanPhone, purpose: 'reset' });
    await Otp.create({ phone: cleanPhone, otp, purpose: 'reset' });
    console.log(`RESET OTP ${cleanPhone}: ${otp} - RANDOM EVERY TIME`);
    res.json({ success: true, message: "OTP sent - check Render Logs", otp: otp });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone ||!otp ||!newPassword) return res.status(400).json({ msg: "All fields required" });
    const cleanPhone = phone.replace(/\D/g, "");
    const found = await Otp.findOne({ phone: cleanPhone, otp, purpose: 'reset' });
    if (!found) return res.status(400).json({ msg: "Invalid or expired OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ emergencyPhone: cleanPhone }, { password: hashed });
    await Otp.deleteMany({ phone: cleanPhone, purpose: 'reset' });
    res.json({ success: true, message: "Password reset successful, login now" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
