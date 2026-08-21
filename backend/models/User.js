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
  googleId: { type: String, default: "", index: true },
  emailVerified: { type: Boolean, default: false },
  lastWeeklyDigestSent: { type: String, default: "" }, // NEW: ISO date, prevents duplicate weekly emails // NEW: soft verification - doesn't block login/signup, just tracked // NEW: links this account to a Google Sign-In identity

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

  themePreference: { type: String, default: "classic-black-gold" },
  customTheme: {
    bg: { type: String, default: "" },
    card: { type: String, default: "" },
    accent: { type: String, default: "" },
  }, // NEW: user-picked colors, used when themePreference === "custom"
  avatar: { type: String, default: "🦋" },
  avatarType: { type: String, enum: ["emoji", "custom"], default: "emoji" },
  avatarImage: { type: String, default: "" }, // NEW: base64 data URI, only used when avatarType === "custom"
  avatarAccessory: { type: String, default: "" }, // NEW: small emoji badge overlaid on avatar, unlocked by level
  backgroundImage: { type: String, default: "" }, // NEW: base64 data URI - either uploaded by the person or AI-generated, used as the app's background image when set

  // NEW: birthday messages - deliberately storing ONLY month/day, not a
  // full date of birth, since a full DOB isn't needed for "happy birthday"

  birthdayMonth: { type: Number, min: 1, max: 12, default: null },
  birthdayDay: { type: Number, min: 1, max: 31, default: null },

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
