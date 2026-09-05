import mongoose from "mongoose";
import Entry from "../models/Entry.js";
import Alert from "../models/Alert.js";
import { encrypt } from "./crypto.js";
import { entryFingerprint, dedupCutoff } from "./entryFingerprint.js";
import { scheduleFollowUp } from "./scheduleFollowUp.js";

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
  const dedupHash = entryFingerprint(userLabel, text);
  let entrySaved = false;
  let alertSaved = false;

  // FIX: one check-in can reach the database through more than one route.
  // The frontend calls /api/analyze; when that is cold-starting or rate
  // limited it falls back to /api/chat (routes/gemini.js), and both land
  // here. The client also has its own /data/save call for the cases where
  // the server did not save. The result was that a single RED/ORANGE
  // disclosure was frequently stored TWICE - which doubled it in the
  // student's own history, double-counted it in the admin panel and in
  // insights, and made the early-warning rule (which escalates on repeated
  // flags) treat one message as a pattern of several. The client now
  // reports back when the server already saved, but that report travels
  // over the same unreliable connection that triggered the fallback, so
  // this window check is the guarantee rather than the optimisation.
  if (dedupHash) {
    try {
      const duplicate = await Entry.exists({
        dedupHash,
        createdAt: { $gte: dedupCutoff() },
      });
      if (duplicate) {
        log("DEDUP-SKIP", riskLevel, score, category, `Identical text already stored moments ago - not duplicating User:${userLabel}`);
        return { entrySaved: false, alertSaved: false, deduped: true };
      }
    } catch (e) {
      // A failed duplicate lookup must never block a crisis record from
      // being written - fall through and save.
      console.error("Dedup check failed (saving anyway):", e.message);
    }
  }

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
      dedupHash,
      emoAbuseDetected: !!(abuseType && abuseType !== "none"),
    });
    entrySaved = true;
    log("ENTRY-SAVED", riskLevel, score, category, `Saved to entries User:${userLabel}`);

    // A RED disclosure earns a check-back tomorrow. Only for a real
    // authenticated user - an anonymous entry has nobody to follow up with.
    if (riskLevel === "RED" && safeUserId) await scheduleFollowUp(safeUserId);
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
