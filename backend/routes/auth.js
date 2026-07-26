import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

async function handleSignup(req, res) {
  try {
    let { name, email, password, age, emergencyName, emergencyPhone, legalConsent } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    emergencyName = emergencyName?.trim() || "";
    emergencyPhone = emergencyPhone?.trim();

    if (!legalConsent ||!legalConsent.given) {
      return res.status(400).json({ msg: "You must accept Privacy Policy and Terms to continue." });
    }

    // NUMBER IS MANDATORY HERE
    if (!name ||!email ||!password ||!age ||!emergencyPhone) {
      return res.status(400).json({ msg: "All fields required - Emergency phone is mandatory" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "User already exists, please login" });
    }

    const hash = await bcrypt.hash(password, 10);

    let role = "user";
    if (email === "kratitvashukla14@mindguard.local" || email === "kratitvashhukla12@mindguard.local") {
      role = "admin";
    }

    const user = await User.create({
      name,
      email,
      password: hash,
      age: Number(age),
      emergencyName,
      emergencyPhone, // mandatory
      role,
      legalConsent: {
        given: true,
        type: legalConsent.type || "all",
        timestamp: new Date(),
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
        userAgent: req.headers['user-agent'],
        consentVersion: "v1.0 - 26 July 2026",
        consentText: legalConsent.consentText || ""
      }
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        emergencyName: user.emergencyName,
        emergencyPhone: user.emergencyPhone,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ msg: "Signup failed", error: err.message });
  }
}

router.post("/signup", handleSignup);
router.post("/register", handleSignup);

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();

    if (!email ||!password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found, please signup" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        emergencyName: user.emergencyName,
        emergencyPhone: user.emergencyPhone,
        role: user.role || "user"
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Login failed", error: err.message });
  }
});

export default router;