import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Load env FIRST
dotenv.config();

import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import alertRoutes from "./routes/alert.js";
import adminRoutes from "./routes/admin.js";
import emotionRoutes from "./routes/emotion.js";
import geminiRoutes from "./routes/gemini.js";
import analyzeRoutes from "./routes/analyze.js";

const app = express();

// FIX 1: Trust proxy for Render - fixes X-Forwarded-For error in your logs
app.set('trust proxy', 1);

app.use(
  cors({
    origin: [
      "https://emovra.pages.dev",
      "http://localhost:5173",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Rate Limiters
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many requests, please wait a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);
app.use("/api/analyze", analyzeLimiter);
app.use("/api/chat", analyzeLimiter);

// PRIVACY: Never log req.body.text
app.use((req, res, next) => {
  if (req.path.includes('/analyze')) {
    console.log(`[REQ] ${req.method} ${req.path} - body length: ${req.body?.text?.length || 0}`);
  }
  next();
});

mongoose
.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB connected");
  console.log(`🔒 Privacy: GREEN/YELLOW not saved, RED/ORANGE -> alerts encrypted`);
})
.catch((err) => {
    console.error("❌ MongoDB Connection Error", err);
    process.exit(1);
  });

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠ GEMINI_API_KEY is missing");
} else {
  console.log("✅ GEMINI_API_KEY found");
}
if (!process.env.ENCRYPT_KEY && !process.env.ENCRYPTION_SECRET) {
  console.warn("⚠ ENCRYPT_KEY / ENCRYPTION_SECRET missing - using fallback, set in Render env");
} else {
  console.log("✅ ENCRYPT_KEY found - privacy encryption enabled");
}

app.get("/", (req, res) => res.send("MindGuard Backend Running - AI Enabled + Privacy RED/ORANGE only"));

app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({ 
  status: "ok", 
  time: new Date(), 
  gemini: !!process.env.GEMINI_API_KEY, 
  mongo: mongoose.connection.readyState === 1,
  privacyMode: "RED_ORANGE_ONLY",
  features: ["school_emotional_abuse","home_abuse","negation","hinglish"]
}));

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "MindGuard API",
    version: "1.1.0",
    endpoints: ["/api/auth", "/api/data", "/api/alerts", "/api/admin", "/api/emotion", "/api/chat", "/api/analyze"]
  });
});

app.use("/api/analyze", analyzeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emotion", emotionRoutes);
app.use("/api", geminiRoutes);

app.use((req, res) => {
  console.log("404 for", req.method, req.originalUrl);
  res.status(404).json({ success: false, message: "API Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡 Rate Limit: 15 analyze/min, 100 general/min`);
  console.log(`🏫 School emotional abuse detection: ENABLED`);
});
