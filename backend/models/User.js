import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  age: { type: Number, required: true, min: 10, max: 100 },
  emergencyName: { type: String, default: "" },
  emergencyPhone: { type: String, required: true },
  countryCode: { type: String, default: "+91" },
  role: { type: String, enum: ["user", "admin"], default: "user" },

  phone: { type: String, default: "" },
  phoneVerified: { type: Boolean, default: false },
  googleId: { type: String, default: "", index: true }, // NEW: links this account to a Google Sign-In identity

  // Gamification (server-authoritative only)
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakDays: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: "" },
  badges: [{ id: String, earnedAt: { type: Date, default: Date.now } }],
  claimedChallenges: [{ date: String, challengeId: String, claimedAt: { type: Date, default: Date.now } }],
  lastChatbotXPDate: { type: String, default: "" }, // NEW: caps chatbot XP to once/day - see routes/chatbot.js
  lastMoodCheckinDate: { type: String, default: "" }, // NEW: for verifying the "log your mood" challenge
  lastGroundingDate: { type: String, default: "" }, // NEW: for verifying the "try a grounding exercise" challenge

  // NEW: personalization - theme stays black/gold by default (see
  // data/themes.js), this is purely opt-in.
  themePreference: { type: String, default: "classic-black-gold" },
  customTheme: {
    bg: { type: String, default: "" },
    card: { type: String, default: "" },
    accent: { type: String, default: "" },
  }, // NEW: user-picked colors, used when themePreference === "custom"
  avatar: { type: String, default: "🦋" }, // emoji avatar
  avatarType: { type: String, enum: ["emoji", "custom"], default: "emoji" }, // NEW
  avatarImage: { type: String, default: "" }, // NEW: base64 data URI, only used when avatarType === "custom"

  // NEW: birthday messages - deliberately storing ONLY month/day, not a
  // full date of birth, since a full DOB isn't needed for "happy birthday"
  // and is more sensitive to store than it needs to be.
  birthdayMonth: { type: Number, min: 1, max: 12, default: null },
  birthdayDay: { type: Number, min: 1, max: 31, default: null },

  // NEW: personality/strength quiz - most recent result only
  personalityResult: {
    quizId: String,
    resultKey: String,
    resultLabel: String,
    takenAt: Date,
  },

  legalConsent: {
    given: { type: Boolean, default: false },
    type: { type: String, default: "all" },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    consentVersion: { type: String, default: "v1.0 - 26 July 2026" },
    consentText: { type: String, default: "" }
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
