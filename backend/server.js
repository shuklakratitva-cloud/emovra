import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet"; // NEW: baseline security headers (was entirely missing)
import * as Sentry from "@sentry/node"; // NEW: error monitoring

dotenv.config();

// NEW: error monitoring - only activates if SENTRY_DSN is set, so this is
// a no-op (not a crash) for anyone who hasn't set up a Sentry account yet.
// Free tier at sentry.io is enough for a project this size. Once you have
// a DSN, add it as SENTRY_DSN in Render's environment variables - no code
// change needed after that, it picks it up automatically on next deploy.
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
import emotionRoutes from "./routes/emotion.js";
import geminiRoutes from "./routes/gemini.js";
import analyzeRoutes from "./routes/analyze.js";
import otpRoutes from "./routes/otp.js";
import voiceRoutes from "./routes/voice.js"; // FIX: was never imported/mounted - /api/voice/analyze always 404'd
import journalShareRoutes from "./routes/journalShare.js"; // NEW: invite-a-friend shared journal feature
import gamificationRoutes from "./routes/gamification.js"; // NEW: xp/level/streak/badges
import challengesRoutes from "./routes/challenges.js"; // NEW: daily challenges
import habitsRoutes from "./routes/habits.js"; // NEW: habit tracker
import chatbotRoutes from "./routes/chatbot.js"; // NEW: AI chatbot with follow-up questions
import dashboardRoutes from "./routes/dashboard.js"; // NEW: personalized dashboard aggregation
import privateJournalRoutes from "./routes/privateJournal.js"; // NEW: unanalyzed, encrypted, admin-invisible journal
import activityTrackingRoutes from "./routes/activityTracking.js"; // NEW: minimal check-in tracking for challenge verification
import insightsRoutes from "./routes/insights.js"; // NEW: mental health insights + early warning + monthly calendar
import sleepRoutes from "./routes/sleep.js"; // NEW: sleep assistant log
import goalsRoutes from "./routes/goals.js"; // NEW: goal planner
import quizRoutes from "./routes/quiz.js"; // NEW: personality/strength quiz
import profileRoutes from "./routes/profile.js"; // NEW: theme/avatar/birthday settings
import accountRoutes from "./routes/account.js"; // NEW: self-serve data export + account deletion
import weeklyDigestRoutes from "./routes/weeklyDigest.js"; // NEW: weekly reflection email, triggered by external cron
import pushRoutes from "./routes/push.js"; // NEW: push notifications
import lettersRoutes from "./routes/letters.js"; // NEW: scheduled letters to future self
import safetyPlanRoutes from "./routes/safetyPlan.js"; // NEW: personal crisis safety plan
import feedbackRoutes from "./routes/feedback.js"; // NEW: in-app feedback/bug reporting
import backgroundGenerateRoutes from "./routes/backgroundGenerate.js"; // NEW: AI background image generation

const app = express();

app.set('trust proxy', 1);

// NEW: baseline security headers - was entirely missing before. Disabled
// CSP here since this is a JSON API (no HTML pages served), and a default
// CSP can sometimes interfere with API responses/CORS in ways that aren't
// worth the tradeoff for a pure API server.
app.use(helmet({ contentSecurityPolicy: false }));

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
app.use("/api/voice", analyzeLimiter); // FIX: voice analysis also hits Gemini, same rate-limit treatment as analyze/chat
app.use("/api/chatbot", analyzeLimiter); // NEW: chatbot also hits Gemini, same treatment
app.use("/api/otp", otpLimiter);

// PRIVACY: Never log req.body.text or OTP
app.use((req, res, next) => {
  if (req.path.includes('/analyze')) {
    console.log(`[REQ] ${req.method} ${req.path} - body length: ${req.body?.text?.length || 0} Cat:${req.body?.category || 'auto'}`);
  }
  if (req.path.includes('/otp')) {
    console.log(`[REQ] ${req.method} ${req.path} - phone: ${req.body?.phone ? req.body.phone.slice(0,3)+'***' : 'none'}`);
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
// FIX (real risk): this used to just warn and silently fall through to a
// hardcoded, PUBLICLY KNOWN fallback key in utils/crypto.js if this env
// var was ever unset - meaning "encrypted" journal/alert data wouldn't
// actually be secret at all. Refusing to start is the right posture here
// for a mental-health app handling encrypted crisis data - same as an
// unset MONGO_URI already stops the server rather than degrading silently.
if (!process.env.ENCRYPT_KEY && !process.env.ENCRYPTION_SECRET) {
  console.error("❌ ENCRYPT_KEY / ENCRYPTION_SECRET missing - refusing to start with weak fallback encryption. Set one of these in your Render env vars.");
  process.exit(1);
} else {
  console.log("✅ ENCRYPT_KEY found - privacy encryption enabled");
}

// EMAIL_USER/EMAIL_APP_PASSWORD (Gmail SMTP) had no startup visibility at
// all before, AND turned out to be fundamentally broken on Render's free
// tier anyway - outbound SMTP (ports 25/465/587) is blocked at the
// network level there, no code fix possible. Switched to Resend (HTTPS
// API, not blocked). This check now looks for RESEND_API_KEY instead.
// Email is optional (Gemini-down alerts + email OTP degrade gracefully
// without it), so this doesn't block startup - just visibility.
if (!process.env.RESEND_API_KEY) {
  console.warn("⚠ RESEND_API_KEY missing - Gemini-down alerts and password-reset emails will show codes on-screen instead of emailing them");
} else {
  console.log("✅ RESEND_API_KEY found - email sending enabled");
}

// NEW: same visibility pattern for the AI background image generation key
if (!process.env.HF_API_KEY) {
  console.warn("⚠ HF_API_KEY missing - AI background generation will show an error until this is set");
} else {
  console.log("✅ HF_API_KEY found - AI background generation enabled");
}

app.get("/", (req, res) => res.send("MindGuard Backend Running - AI Enabled + Privacy RED/ORANGE only"));

app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  time: new Date(),
  gemini: !!process.env.GEMINI_API_KEY,
  mongo: mongoose.connection.readyState === 1,
  privacyMode: "RED_ORANGE_ONLY_ENTRIES",
  alertsMode: "SCHOOL_EMOTIONAL_ABUSE_ONLY",
  otpMode: "RANDOM_EVERY_TIME",
  features: ["school_emotional_abuse","home_abuse","negation","hinglish","otp_phone_verify","voice_analysis"]
}));

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "MindGuard API",
    version: "1.2.0",
    endpoints: ["/api/auth", "/api/data", "/api/alerts", "/api/admin", "/api/emotion", "/api/chat", "/api/analyze", "/api/voice/analyze", "/api/otp/send", "/api/otp/verify", "/api/journal-share"]
  });
});

// --- ALL ROUTES ---
app.use("/api/otp", otpRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emotion", emotionRoutes);
app.use("/api/voice", voiceRoutes); // FIX: was missing entirely
app.use("/api/journal-share", journalShareRoutes); // NEW: invite-a-friend shared journal
app.use("/api/gamification", gamificationRoutes); // NEW
app.use("/api/challenges", challengesRoutes); // NEW
app.use("/api/habits", habitsRoutes); // NEW
app.use("/api/chatbot", chatbotRoutes); // NEW
app.use("/api/dashboard", dashboardRoutes); // NEW
app.use("/api/private-journal", privateJournalRoutes); // NEW: unanalyzed, encrypted journal
app.use("/api/activity", activityTrackingRoutes); // NEW: minimal check-in tracking
app.use("/api/insights", insightsRoutes); // NEW
app.use("/api/sleep", sleepRoutes); // NEW
app.use("/api/goals", goalsRoutes); // NEW
app.use("/api/quiz", quizRoutes); // NEW
app.use("/api/profile", profileRoutes); // NEW
app.use("/api/account", accountRoutes); // NEW: data export + deletion
app.use("/api/weekly-digest", weeklyDigestRoutes); // NEW: weekly reflection email
app.use("/api/push", pushRoutes); // NEW: push notifications
app.use("/api/letters", lettersRoutes); // NEW: scheduled letters to future self
app.use("/api/safety-plan", safetyPlanRoutes); // NEW: personal crisis safety plan
app.use("/api/feedback", feedbackRoutes); // NEW: in-app feedback/bug reporting
app.use("/api/background", backgroundGenerateRoutes); // NEW: AI background image generation
app.use("/api", geminiRoutes); // exposes POST /api/chat

app.use((req, res) => {
  console.log("404 for", req.method, req.originalUrl);
  res.status(404).json({ success: false, message: "API Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);
  if (process.env.SENTRY_DSN) Sentry.captureException(err); // NEW
  res.status(500).json({ success: false, message: err.message });
});

// NEW: catches crashes that happen outside any Express route entirely -
// an unhandled promise rejection or uncaught exception would otherwise
// take the whole server down with nothing but a bare stack trace in the
// logs. Reports to Sentry (if configured) and logs either way, so a crash
// is at minimum visible instead of just... the server going quiet.
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  if (process.env.SENTRY_DSN) Sentry.captureException(reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡 Rate Limit: 15 analyze/min, 5 OTP/min, 100 general/min`);
  console.log(`🏫 School emotional abuse detection: ENABLED -> alerts collection only`);
  console.log(`🔴 Entries: RED + ORANGE only -> entries collection`);
  console.log(`📱 OTP: Random OTP every time + phone verify -> otps + users collection`);
});
