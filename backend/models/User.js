import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // <-- MUST be default import, not { User }

const router = express.Router();

// SIGNUP - maps to your form: name, email, age, kutta=emergencyName, +91, phone, password
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, age, emergencyName, emergencyPhone, countryCode, legalConsent } = req.body;
    console.log("Signup attempt:", email);

    if (!name || !email || !password || !age) {
      return res.status(400).json({ msg: "Name, email, password, age required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      age: Number(age),
      emergencyName: emergencyName || "",
      emergencyPhone: emergencyPhone || "",
      countryCode: countryCode || "+91",
      legalConsent: {
        given: true,
        type: legalConsent?.type || "all",
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        consentVersion: "v1.0 - 26 July 2026",
        consentText: legalConsent?.consentText || "User accepted Terms & Privacy"
      }
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;