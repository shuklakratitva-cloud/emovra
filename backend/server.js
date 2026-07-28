import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import alertRoutes from "./routes/alert.js";
import adminRoutes from "./routes/admin.js";
import emotionRoutes from "./routes/emotion.js";
import geminiRoutes from "./routes/gemini.js";
import analyzeRoutes from "./routes/analyze.js"; // <-- FIXED ESM

dotenv.config();
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error");
    console.error(err);
    process.exit(1);
  });

// Checks
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠ GEMINI_API_KEY is missing - Gemini will fail");
} else {
  console.log("✅ GEMINI_API_KEY found");
}
if (!process.env.ENCRYPTION_SECRET) {
  console.warn("⚠ ENCRYPTION_SECRET missing - using fallback. Set it in Render!");
}

app.get("/", (req, res) => {
  res.send("MindGuard Backend Running - AI Enabled");
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "MindGuard API",
    version: "1.0.0",
    status: "Running - Admin + AI + Gemini + Encryption + Analyze enabled",
    endpoints: ["/api/auth", "/api/data", "/api/alerts", "/api/admin", "/api/emotion", "/api/chat", "/api/analyze"]
  });
});

// Routes - ALL FEATURES
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emotion", emotionRoutes);
app.use("/api", geminiRoutes); // /api/chat
app.use("/api/analyze", analyzeRoutes); // FIXED - now works for negations + hinglish

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});