import mongoose from "mongoose";
import Entry from "../models/Entry.js";
import Alert from "../models/Alert.js";
import { encrypt } from "./crypto.js";

function log(tag, risk, score, category, extra = "") {
  console.log(`[${tag}] Risk:${risk} Score:${score} Cat:${category} ${extra}`);
}

function toObjectIdOrNull(v) {
  if (v && mongoose.Types.ObjectId.isValid(v)) return v;
  return null;
}

export async function saveAnalysis({
  userId,      // real authenticated user id if available, else "anonymous"/email/etc
  text,
  risk,
  score,
  category,
  abuseType,
  abuseSource,
  triggers,
  emotion,
  phone,
}) {
  const riskLevel = String(risk || "GREEN").toUpperCase();
  const safeUserId = toObjectIdOrNull(userId);
  const userLabel = userId || "anonymous";

  if (riskLevel !== "RED" && riskLevel !== "ORANGE") {
    log("PRIVACY-SKIP", riskLevel, score, category, `GREEN not saved - User:${userLabel}`);
    return { entrySaved: false, alertSaved: false };
  }

  const text_encrypted = encrypt(text || "");
  let entrySaved = false;
  let alertSaved = false;

  try {
    await Entry.create({
      userId: safeUserId,
      anonId: safeUserId ? "" : String(userLabel),
      riskLevel,
      score,
      category: category || "general",
      abuseType: abuseType || "none",
      abuseSource: abuseSource || "none",
      triggers: triggers || [],
      emotion: emotion || "neutral",
      text_encrypted,
      emoAbuseDetected: !!(abuseType && abuseType !== "none"),
    });
    entrySaved = true;
    log("ENTRY-SAVED", riskLevel, score, category, `Saved to entries User:${userLabel}`);
  } catch (e) {
    console.error("Entry save error:", e.message);
  }

  const isSchoolAbuse =
    category === "school_emotional_abuse" || abuseType === "school_emotional_abuse";

  if (isSchoolAbuse) {
    try {
      await Alert.create({
        userId: safeUserId,
        anonId: safeUserId ? "" : String(userLabel),
        riskLevel,
        score,
        category: category || "school_emotional_abuse",
        abuseType: abuseType || "school_emotional_abuse",
        abuseSource: abuseSource || "teacher",
        triggers: triggers || [],
        text_encrypted,
        phone: phone || "",
        status: "ACTIVE",
      });
      alertSaved = true;
      log("ALERT-SAVED", riskLevel, score, category, `CLASSROOM ABUSE -> alerts User:${userLabel}`);
    } catch (e) {
      console.error("Alert save error:", e.message);
    }
  } else {
    log("ALERT-SKIP", riskLevel, score, category, "Not classroom abuse, only in entries");
  }

  return { entrySaved, alertSaved };
}
