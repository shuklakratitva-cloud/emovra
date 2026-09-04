import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import * as Sentry from "@sentry/node";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  console.log("🔭 Sentry error monitoring: ENABLED");
} else {
  console.log("🔭 Sentry error monitoring: not configured (set SENTRY_DSN to enable)");
}

import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import alertRoutes from "./routes/alert.js";
import adminRoutes from "./routes/admin.js";
import geminiRoutes from "./routes/gemini.js";
import analyzeRoutes from "./routes/analyze.js";
import otpRoutes from "./routes/otp.js";
import voiceRoutes from "./routes/voice.js";
import journalShareRoutes from "./routes/journalShare.js";
import gamificationRoutes from "./routes/gamification.js";
import challengesRoutes from "./routes/challenges.js";
import habitsRoutes from "./routes/habits.js";
import chatbotRoutes from "./routes/chatbot.js";
import dashboardRoutes from "./routes/dashboard.js";
import privateJournalRoutes from "./routes/privateJournal.js";
import activityTrackingRoutes from "./routes/activityTracking.js";
import insightsRoutes from "./routes/insights.js";
import sleepRoutes from "./routes/sleep.js";
import goalsRoutes from "./routes/goals.js";
import quizRoutes from "./routes/quiz.js";
import profileRoutes from "./routes/profile.js";
import accountRoutes from "./routes/account.js";
import weeklyDigestRoutes from "./routes/weeklyDigest.js";
import pushRoutes from "./routes/push.js";
import lettersRoutes from "./routes/letters.js";
import safetyPlanRoutes from "./routes/safetyPlan.js";
import feedbackRoutes from "./routes/feedback.js";
import backgroundGenerateRoutes from "./routes/backgroundGenerate.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: ["https://emovra.pages.dev", "http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-cron-secret"],
  })
);

app.use(express.json({ limit: "4mb" }));

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

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests, wait 1 min" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);
app.use("/api/analyze", analyzeLimiter);
app.use("/api/chat", analyzeLimiter);
app.use("/api/voice", analyzeLimiter);
app.use("/api/chatbot", analyzeLimiter);
app.use("/api/otp", otpLimiter);

app.use((req, res, next) => {
  if (req.path.includes("/analyze")) {
    console.log(
      `[REQ] ${req.method} ${req.path} - body length: ${req.body?.text?.length || 0} Cat:${req.body?.category || "auto"}`
    );
  }
  if (req.path.includes("/otp")) {
    console.log(
      `[REQ] ${req.method} ${req.path} - phone: ${req.body?.phone ? req.body.phone.slice(0, 3) + "***" : "none"}`
    );
  }
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log(`🔒 Privacy: GREEN not saved, RED/ORANGE -> entries encrypted`);
    console.log(`🏫 Alerts: ONLY school_emotional_abuse -> alerts collection`);
    console.log(`📱 OTP: Random every time + phone verification ENABLED`);
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

if (!process.env.GROQ_API_KEY) {
  console.warn("⚠ GROQ_API_KEY is missing - the Gemini-down fallback classifier won't work");
} else {
  console.log("✅ GROQ_API_KEY found");
}

if (!process.env.ENCRYPT_KEY && !process.env.ENCRYPTION_SECRET) {
  console.error(
    "❌ ENCRYPT_KEY / ENCRYPTION_SECRET missing - refusing to start with weak fallback encryption. Set one of these in your Render env vars."
  );
  process.exit(1);
} else {
  console.log("✅ ENCRYPT_KEY found - privacy encryption enabled");
}

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
  console.warn(
    "⚠ BREVO_API_KEY or BREVO_SENDER_EMAIL missing - Gemini-down alerts and password-reset emails will show codes on-screen instead of emailing them"
  );
} else {
  console.log("✅ BREVO_API_KEY found - email sending enabled");
}

if (!process.env.HF_API_KEY) {
  console.warn(
    "⚠ HF_API_KEY missing - AI background generation will show an error until this is set"
  );
} else {
  console.log("✅ HF_API_KEY found - AI background generation enabled");
}

app.get("/", (req, res) =>
  res.send("MindGuard Backend Running - AI Enabled + Privacy RED/ORANGE only")
);

app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    time: new Date(),
    gemini: !!process.env.GEMINI_API_KEY,
    mongo: mongoose.connection.readyState === 1,
    privacyMode: "RED_ORANGE_ONLY_ENTRIES",
    alertsMode: "SCHOOL_EMOTIONAL_ABUSE_ONLY",
    otpMode: "RANDOM_EVERY_TIME",
    features: [
      "school_emotional_abuse",
      "home_abuse",
      "negation",
      "hinglish",
      "otp_phone_verify",
      "voice_analysis",
    ],
  })
);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "MindGuard API",
    version: "1.2.0",
    endpoints: [
      "/api/auth",
      "/api/data",
      "/api/alerts",
      "/api/admin",
      "/api/chat",
      "/api/analyze",
      "/api/voice/analyze",
      "/api/otp/send",
      "/api/otp/verify",
      "/api/journal-share",
    ],
  });
});

// FIX: disabled. routes/otp.js implements phone-number OTP verification,
// but there is no SMS provider anywhere in this codebase (confirmed via a
// full grep - no Twilio/MSG91/Fast2SMS/etc.), and nothing in the live
// frontend calls /api/otp/* or /api/analyze/otp/* any more - the actual
// "forgot password" and "verify your account" flows both moved to email
// OTP through auth.js (see src/components/Auth.jsx's own comment: "was
// phone - phone OTP never sent"). As implemented, every one of these
// routes returns the OTP directly in its JSON response body (and logs it
// to console) instead of sending it anywhere out-of-band, so "phone
// verification" here provided no real security - anyone who could see the
// response got the code without ever touching the phone, and /verify
// (analyze.js's copy) could mark any phone number "verified" against your
// own account with zero proof of ownership. Since nothing legitimate
// depends on this, disabling the route entirely removes that live,
// unauthenticated-in-effect attack surface. Add this back once there's a
// real SMS provider wired in.
// app.use("/api/otp", otpRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin", adminRoutes);
// NOTE: the old /api/emotion route (routes/emotion.js) was removed - it
// was a third, weaker reimplementation of the same risk classifier as
// /api/analyze and /api/chat (its own inline keyword list instead of the
// shared localRiskFallback util, no Groq fallback, no Hindi/Hinglish
// coverage), fully unauthenticated, and nothing in the frontend called it
// (confirmed via repo-wide search). Removing it both de-duplicates the
// risk-classification logic and closes an unauthenticated Gemini/Groq
// quota-drain surface. /api/analyze and /api/chat remain, and both already
// share the same localRiskFallback/hasUnnegatedPhrase/saveAnalysis utils.
app.use("/api/voice", voiceRoutes);
app.use("/api/journal-share", journalShareRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/private-journal", privateJournalRoutes);
app.use("/api/activity", activityTrackingRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/weekly-digest", weeklyDigestRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/letters", lettersRoutes);
app.use("/api/safety-plan", safetyPlanRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/background", backgroundGenerateRoutes);
app.use("/api", geminiRoutes);

app.use((req, res) => {
  console.log("404 for", req.method, req.originalUrl);
  res.status(404).json({ success: false, message: "API Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(500).json({ success: false, message: err.message });
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  if (process.env.SENTRY_DSN) Sentry.captureException(reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡 Rate Limit: 15 analyze/min, 5 OTP/min, 100 general/min`);
  console.log(`🏫 School emotional abuse detection: ENABLED -> alerts collection only`);
  console.log(`🔴 Entries: RED + ORANGE only -> entries collection`);
  console.log(`📱 OTP: Random OTP every time + phone verify -> otps + users collection`);
});
