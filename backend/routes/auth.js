import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Otp from "../models/otp.js";
import { sendEmail } from "../utils/mailer.js";
import { isPlausiblePhoneNumber } from "../utils/phoneValidation.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "20d" }
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified };
}

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

    const cleanEmergencyPhone = emergencyPhone.replace(/\D/g, "");
    if (!isPlausiblePhoneNumber(countryCode, cleanEmergencyPhone)) {
      return res.status(400).json({ msg: "That doesn't look like a valid phone number for the selected country - please double check it." });
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
      emergencyPhone: cleanEmergencyPhone,
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

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });

    (async () => {
      try {
        const verifyOtp = crypto.randomInt(100000, 999999).toString();
        await Otp.deleteMany({ email, purpose: 'verify' });
        await Otp.create({ email, otp: verifyOtp, purpose: 'verify' });
        await sendEmail({
          to: email,
          subject: "Verify your Emovra email",
          text: `Your Emovra email verification code is ${verifyOtp}. It expires in 5 minutes.`,
        });
      } catch (e) {
        console.error("Signup verification email failed (non-blocking):", e.message);
      }
    })();
    return;

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
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ msg: "Email and password required" });
    }
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: err.message });
  }
});

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

router.post("/google", async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ msg: "Google Sign-In isn't configured on this server yet (missing GOOGLE_CLIENT_ID)." });
    }

    const { credential, age, emergencyName, emergencyPhone, countryCode, legalConsent } = req.body;
    if (!credential) return res.status(400).json({ msg: "Missing Google credential" });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (e) {
      return res.status(401).json({ msg: "Invalid Google credential" });
    }

    if (!payload.email_verified) {
      return res.status(400).json({ msg: "Your Google email isn't verified - can't use it to sign in here." });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {

      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      const token = signToken(user);
      return res.json({ token, user: publicUser(user) });
    }

    if (!age || !emergencyPhone) {
      return res.json({
        success: true,
        needsSignup: true,
        googleEmail: email,
        googleName: payload.name || "",
      });
    }

    if (!legalConsent?.given) {
      return res.status(400).json({ msg: "You must accept Privacy Policy and Terms" });
    }

    const cleanEmergencyPhone = String(emergencyPhone).replace(/\D/g, "");
    const googleCountryCode = countryCode?.trim() || "+91";
    if (!isPlausiblePhoneNumber(googleCountryCode, cleanEmergencyPhone)) {
      return res.status(400).json({ msg: "That doesn't look like a valid phone number for the selected country - please double check it." });
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      password: hashed,
      googleId,
      age: Number(age),
      emergencyName: emergencyName?.trim() || "",
      emergencyPhone: cleanEmergencyPhone,
      countryCode: googleCountryCode,
      role: "user",
      legalConsent: {
        given: true,
        type: legalConsent?.type || "all",
        timestamp: new Date(),
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
        userAgent: req.headers["user-agent"],
        consentVersion: "v1.0 - 26 July 2026",
        consentText: legalConsent?.consentText || "User accepted Terms & Privacy via Google Sign-In"
      }
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });

  } catch (err) {
    console.error("Google Sign-In error:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post('/forgot-password/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ msg: "Email required" });
    }
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({ success: true, message: "If an account exists for that email, a code has been sent." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });
    await Otp.create({ email: cleanEmail, otp, purpose: 'reset' });

    const sent = await sendEmail({
      to: cleanEmail,
      subject: "Emovra password reset code",
      text: `Your password reset code is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    });

    if (sent) {
      console.log(`[RESET-OTP-EMAIL] Sent to ${cleanEmail}`);
      return res.json({ success: true, message: "If an account exists for that email, a code has been sent." });
    }

    console.warn(`[RESET-OTP-EMAIL] Mailer not configured - returning code in response for ${cleanEmail}: ${otp}`);
    return res.json({ success: true, message: "Email sending isn't configured yet - here's your code directly.", otp, devMode: true });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== "string" || typeof otp !== "string" || typeof newPassword !== "string" || !email || !otp || !newPassword) {
      return res.status(400).json({ msg: "All fields required" });
    }
    const cleanEmail = email.trim().toLowerCase();

    const found = await Otp.findOne({ email: cleanEmail, purpose: 'reset' }).sort({ createdAt: -1 });
    if (!found) return res.status(400).json({ msg: "No code found. Please request a new one." });

    const ageSec = (Date.now() - new Date(found.createdAt).getTime()) / 1000;
    if (ageSec > 300) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });
      return res.status(400).json({ msg: "Code expired. Request a new one." });
    }
    if (found.attempts >= 5) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });
      return res.status(400).json({ msg: "Too many attempts. Request a new code." });
    }
    if (found.otp !== otp) {
      found.attempts += 1;
      await found.save();
      return res.status(400).json({ msg: "Invalid code", attemptsLeft: 5 - found.attempts });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email: cleanEmail }, { password: hashed });
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });
    res.json({ success: true, message: "Password reset successful, login now" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/verify-email/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ msg: "Email required" });
    }
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.json({ success: true, message: "If an account exists for that email, a code has been sent." });
    }
    if (user.emailVerified) {
      return res.json({ success: true, alreadyVerified: true, message: "This email is already verified." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: cleanEmail, purpose: 'verify' });
    await Otp.create({ email: cleanEmail, otp, purpose: 'verify' });

    const sent = await sendEmail({
      to: cleanEmail,
      subject: "Verify your Emovra email",
      text: `Your Emovra email verification code is ${otp}. It expires in 5 minutes.`,
    });

    if (sent) {
      return res.json({ success: true, message: "Verification code sent - check your inbox." });
    }
    return res.json({ success: true, message: "Email sending isn't configured yet - here's your code directly.", otp, devMode: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/verify-email/confirm', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (typeof email !== "string" || typeof otp !== "string" || !email || !otp) {
      return res.status(400).json({ msg: "Email and code required" });
    }
    const cleanEmail = email.trim().toLowerCase();

    const found = await Otp.findOne({ email: cleanEmail, purpose: 'verify' }).sort({ createdAt: -1 });
    if (!found) return res.status(400).json({ msg: "No code found. Please request a new one." });

    const ageSec = (Date.now() - new Date(found.createdAt).getTime()) / 1000;
    if (ageSec > 300) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'verify' });
      return res.status(400).json({ msg: "Code expired. Request a new one." });
    }
    if (found.attempts >= 5) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'verify' });
      return res.status(400).json({ msg: "Too many attempts. Request a new code." });
    }
    if (found.otp !== otp) {
      found.attempts += 1;
      await found.save();
      return res.status(400).json({ msg: "Invalid code", attemptsLeft: 5 - found.attempts });
    }

    await User.findOneAndUpdate({ email: cleanEmail }, { emailVerified: true });
    await Otp.deleteMany({ email: cleanEmail, purpose: 'verify' });
    res.json({ success: true, message: "Email verified!" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
