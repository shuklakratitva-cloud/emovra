import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
      emergencyPhone: emergencyPhone.replace(/\D/g,""),
      countryCode,
      role,
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
      user: { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role }
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
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, age: user.age, emergencyName: user.emergencyName, emergencyPhone: user.emergencyPhone, countryCode: user.countryCode, role: user.role || "user" } });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
