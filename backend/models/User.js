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