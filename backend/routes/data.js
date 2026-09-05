import express from "express";
import Entry, { decrypt } from "../models/Entry.js";
import auth from "../middleware/auth.js";
import { awardXP } from "../utils/gamification.js";
import { entryFingerprint, dedupCutoff } from "../utils/entryFingerprint.js";
import { scheduleFollowUp } from "../utils/scheduleFollowUp.js";

const router = express.Router();

// Whitelists for the classification fields below. The client is the one
// that ran the analysis on these paths, so it supplies these values - but
// they end up driving the admin panel's triage view, so an unexpected
// string must never make it into the database and quietly break a filter.
// Anything not on the list falls back to the safe default.
const VALID_RISK_LEVELS = ["GREEN", "YELLOW", "ORANGE", "RED"];
const VALID_CATEGORIES = ["general", "self_harm", "emotional_abuse", "school_emotional_abuse"];
const VALID_ABUSE_TYPES = ["none", "home_abuse", "school_emotional_abuse", "both"];
const VALID_ABUSE_SOURCES = ["none", "teacher", "parent", "peer"];

function pick(value, allowed, fallback) {
  const v = String(value || "").trim();
  if (!v) return fallback;
  const upper = v.toUpperCase();
  if (allowed.includes(upper)) return upper;
  const lower = v.toLowerCase();
  return allowed.includes(lower) ? lower : fallback;
}

router.post('/save', auth, async (req, res) => {
  try {
    const { text, score, emotion, reasons } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text required" });

    // FIX: this route used to destructure ONLY text/score/emotion/reasons
    // and throw away every classification field the client sent with them.
    // That silently broke school-abuse reporting. When a student wrote
    // something like "teacher said I'm useless in front of the whole
    // class", MindGuardApp's local pattern matched it, built a result with
    // category "school_emotional_abuse" / abuseSource "teacher" / ORANGE
    // 85, and posted it here - where all of that was dropped on the floor.
    // The stored Entry got category "general", abuseType "none", and a
    // riskLevel re-derived from the score as RED. In the admin panel that
    // meant three things at once: it was filed under Self-Harm instead of
    // Emotional Abuse, it was badged "GENERAL" rather than "ABUSE", and -
    // because /api/admin/alerts only reveals text when it recognises an
    // abuse case - the message itself came back redacted behind "message
    // content stays private". The one report type that most needs a human
    // to read it was the one an admin could not read.
    const riskLevel = pick(req.body.riskLevel, VALID_RISK_LEVELS, "");
    const category = pick(req.body.category, VALID_CATEGORIES, "general");
    const abuseType = pick(req.body.abuseType, VALID_ABUSE_TYPES, "none");
    const abuseSource = pick(req.body.abuseSource, VALID_ABUSE_SOURCES, "none");
    const triggers = Array.isArray(req.body.triggers)
      ? req.body.triggers.map(String).slice(0, 10)
      : Array.isArray(reasons)
        ? reasons.map(String).slice(0, 10)
        : [];

    // FIX: same duplicate guard as utils/saveAnalysis.js, because this is
    // the other half of the double-write. The client calls this route only
    // when it believes the server did not already store the check-in - but
    // /api/analyze and /api/chat both save on their own, and if either of
    // their responses was lost in transit the client cannot tell and posts
    // the record here as well. Without this, one crisis message became two
    // rows: doubled in the student's history, in admin counts, and in the
    // early-warning rule that escalates on repeated flags.
    const dedupHash = entryFingerprint(req.user.id, text);
    if (dedupHash) {
      try {
        const duplicate = await Entry.exists({
          dedupHash,
          createdAt: { $gte: dedupCutoff() },
        });
        if (duplicate) {
          console.log(`[DEDUP-SKIP] /data/save - identical text already stored moments ago - User:${req.user.id}`);
          // Reported as success on purpose: from the user's point of view
          // their entry IS saved (the first write holds it). Returning an
          // error here would make the UI show a save failure for a check-in
          // that was, in fact, recorded.
          return res.json({
            success: true,
            duplicate: true,
            message: "Already saved",
          });
        }
      } catch (e) {
        console.error("Dedup check failed (saving anyway):", e.message);
      }
    }

    const entry = new Entry({
      userId: req.user.id,
      score: Number(score) || 0,
      emotion: emotion || "neutral",
      reasons: reasons || [],
      category,
      abuseType,
      abuseSource,
      triggers,
      dedupHash,
    });

    // Only set riskLevel when the client actually classified one. Leaving
    // it untouched otherwise lets the model's pre-save hook derive it from
    // the score, which is the long-standing behaviour for this route.
    if (riskLevel) entry.riskLevel = riskLevel;

    // Keep this consistent with saveAnalysis(), which marks the flag from
    // the classification rather than only from keyword matching - the
    // pre-save hook's abuseWords list doesn't contain "useless",
    // "nikamma", "nalayak" or most of what school abuse actually sounds
    // like, so a real report would otherwise stay flagged false.
    if (abuseType && abuseType !== "none") entry.emoAbuseDetected = true;

    entry._plainText = text;
    await entry.save();

    // Same check-back as the server-side classifier paths, so it does not
    // matter which route stored the disclosure.
    if (entry.riskLevel === "RED") await scheduleFollowUp(req.user.id, entry._id);

    const totalEntries = await Entry.countDocuments({ userId: req.user.id });
    const gam = await awardXP(req.user.id, 10, { firstJournalEntry: totalEntries === 1 });

    res.json({
      success: true,
      riskLevel: entry.riskLevel,
      score: entry.score,
      category: entry.category,
      abuseType: entry.abuseType,
      emoAbuseDetected: entry.emoAbuseDetected,
      message: "Saved securely (encrypted)",
      gamification: gam,
    });
  } catch (err) {
    console.error("Save entry error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);

    const decrypted = entries.map(e => {
      const obj = e.toObject();
      return {
        _id: obj._id,
        riskLevel: obj.riskLevel,
        score: obj.score,
        emotion: obj.emotion,
        reasons: obj.reasons,
        emoAbuseDetected: obj.emoAbuseDetected,
        timestamp: obj.timestamp,
        createdAt: obj.createdAt,
        text: obj.text_encrypted ? decrypt(obj.text_encrypted) : "[old entry - no encryption]"
      };
    });

    res.json(decrypted);
  } catch (err) {
    console.error("Get my entries error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
