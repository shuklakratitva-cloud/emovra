import express from "express";

import {
  createAlert,
  getRedAlert,
  clearAlert,
  callSOS,
  getAlertHistory,
} from "../controllers/alertController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

const humanReviewLogger = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (req.body?.riskLevel === "RED" || req.body?.score >= 90) {
      // FIX: this used to print the user's email, name and the first 150
      // characters of their crisis disclosure straight to stdout. The whole
      // point of encrypting alert text at rest (createAlert -> crypto.js,
      // which refuses to run without a real key) is defeated if the same
      // content is echoed in plaintext into Render's log stream, which is
      // retained and readable by anyone with dashboard access. Log only
      // non-identifying routing metadata; the alert itself is in the DB.
      console.log("🚨🚨 CRITICAL RED ALERT FOR HUMAN REVIEW 🚨🚨🚨");
      console.log("Time:", new Date().toISOString());
      console.log("UserId:", req.body.userId);
      console.log("Risk:", req.body.riskLevel, "Score:", req.body.score);
      console.log("Category:", req.body.category);
      console.log("(text withheld from logs - view it in the admin panel)");
      console.log("------------------------------------------------");
    }
    return originalJson.call(this, data);
  };
  next();
};

router.post("/", protect, humanReviewLogger, createAlert);
router.post("/red", protect, humanReviewLogger, createAlert);
router.get("/red", protect, getRedAlert);
router.get("/history", protect, getAlertHistory);
router.post("/call/:id", protect, callSOS);
router.patch("/clear/:id", protect, clearAlert);

export default router;
