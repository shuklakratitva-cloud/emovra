import express from "express";
import { protect as auth } from "../middleware/auth.js";
import SafetyPlan from "../models/SafetyPlan.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const router = express.Router();

function serialize(doc) {
  if (!doc) return null;
  const safeDecrypt = (v) => { try { return v ? decrypt(v) : ""; } catch { return ""; } };
  return {
    warningSigns: safeDecrypt(doc.warningSigns_encrypted),
    copingStrategies: safeDecrypt(doc.copingStrategies_encrypted),
    supportContacts: safeDecrypt(doc.supportContacts_encrypted),
    reasonsToLive: safeDecrypt(doc.reasonsToLive_encrypted),
    updatedAt: doc.updatedAt,
  };
}

// GET /api/safety-plan - your own plan, or null if you haven't made one yet
router.get("/", auth, async (req, res) => {
  try {
    const plan = await SafetyPlan.findOne({ userId: req.user.id });
    res.json({ success: true, plan: serialize(plan) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load safety plan" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const { warningSigns, copingStrategies, supportContacts, reasonsToLive } = req.body;
    const update = {
      warningSigns_encrypted: encrypt(String(warningSigns || "").trim()),
      copingStrategies_encrypted: encrypt(String(copingStrategies || "").trim()),
      supportContacts_encrypted: encrypt(String(supportContacts || "").trim()),
      reasonsToLive_encrypted: encrypt(String(reasonsToLive || "").trim()),
    };
    const plan = await SafetyPlan.findOneAndUpdate(
      { userId: req.user.id },
      update,
      { upsert: true, returnDocument: "after" }
    );
    res.json({ success: true, plan: serialize(plan) });
  } catch (err) {
    console.error("Safety plan save error:", err);
    res.status(500).json({ success: false, message: "Failed to save safety plan" });
  }
});

export default router;
