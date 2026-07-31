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
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role, phoneVerified: user.phoneVerified };
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
    // FIX: was only checking "is this 7-15 digits" - now validates against
    // real phone number patterns for the selected country (catches things
    // like "1234567890" or a number with the wrong length for that
    // country's format). Doesn't confirm the number is real/reachable -
    // that needs actual SMS/call verification, see the note at the top of
    // this file's Google Sign-In section for why that's not built here.
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

// ============================================================
// GOOGLE SIGN-IN
// Doubles as an account-recovery path: if you forget your password but
// your account email matches a Google account, you can sign in via Google
// instead of resetting anything. Also works for brand-new signups.
//
// REQUIRED ENV VAR: GOOGLE_CLIENT_ID (free - create at
// https://console.cloud.google.com/apis/credentials, "OAuth client ID",
// type "Web application". No billing/payment step involved at all - this
// is a different, free part of Google Cloud Console from the Gemini API
// billing screen.)
// ============================================================
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
      // existing account - link the Google id if not already linked, then log in
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      const token = signToken(user);
      return res.json({ token, user: publicUser(user) });
    }

    // No account yet. Google only gives us name/email - this app requires
    // age + emergency contact for its safety features, so if those weren't
    // sent, ask the frontend to collect them and resubmit with the SAME
    // credential rather than creating an incomplete account.
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

    // FIX: same real phone format validation as regular signup - was
    // completely unvalidated here before.
    const cleanEmergencyPhone = String(emergencyPhone).replace(/\D/g, "");
    const googleCountryCode = countryCode?.trim() || "+91";
    if (!isPlausiblePhoneNumber(googleCountryCode, cleanEmergencyPhone)) {
      return res.status(400).json({ msg: "That doesn't look like a valid phone number for the selected country - please double check it." });
    }

    // Google-only accounts still need SOME password on the schema - a
    // long random one that's never shown or used, since login always goes
    // through Google for this account (they can also set a real one later
    // via forgot-password if they ever want a password login too).
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

// ============================================================
// FORGOT PASSWORD - now via EMAIL OTP, not phone.
//
// FIX: phone-based OTP (the old /send-verify-otp, /verify-phone,
// /forgot-password/* routes) never actually sent a real SMS - there's no
// SMS gateway wired up (that needs a paid provider + DLT registration for
// Indian numbers, a real regulatory hurdle, not something this codebase
// can route around). Every "OTP sent" response was just the code being
// echoed back in the API response, and the phone "Verify Phone Number"
// card never provided any real verification. That phone-verification UI
// has been removed from the frontend.
//
// Password reset specifically has been rebuilt around EMAIL OTP instead,
// using the same free Gmail-based sending already built for the
// Gemini-down admin alert (utils/mailer.js). This is genuinely delivered,
// not just logged/echoed.
// ============================================================

router.post('/forgot-password/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ msg: "Email required" });
    }
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    // Don't reveal whether an account exists - same response either way,
    // avoids leaking which emails are registered.
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

    // Mailer isn't configured (EMAIL_USER/EMAIL_APP_PASSWORD unset) -
    // fall back to returning the code directly so this still works during
    // setup/testing, same safety net pattern as the rest of this app's AI
    // fallbacks. Clearly logged so it's obvious this is the degraded path.
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

export default router;
