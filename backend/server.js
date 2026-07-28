import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

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

// PRIVACY: Never log req.body.text - only method + path
app.use((req, res, next) => {
  if (req.path.includes('/analyze')) {
    console.log(`[REQ] ${req.method} ${req.path} - body length: ${req.body?.text?.length || 0}`);
  }
  next();
});

mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
    console.error("❌ MongoDB Connection Error", err);
    process.exit(1);
  });

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠ GEMINI_API_KEY is missing");
} else {
  console.log("✅ GEMINI_API_KEY found");
}
if (!process.env.ENCRYPTION_SECRET) {
  console.warn("⚠ ENCRYPTION_SECRET missing - using fallback key, set it in Render env");
}

app.get("/", (req, res) => res.send("MindGuard Backend Running - AI Enabled"));

// Health for UptimeRobot - light, no DB, no logs of user data
app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date(), gemini:!!process.env.GEMINI_API_KEY, mongo: mongoose.connection.readyState === 1 }));

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "MindGuard API",
    version: "1.0.0",
    endpoints: ["/api/auth", "/api/data", "/api/alerts", "/api/admin", "/api/emotion", "/api/chat", "/api/analyze"]
  });
});

// FIXED ORDER - specific routes first
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
  console.error("SERVER ERROR:", err.message); // Only message, never body
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});