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

// ✅ STEP 1.4: Human Review Logger Middleware
const humanReviewLogger = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // Log if this was a RED alert creation
    if (req.body?.riskLevel === "RED" || req.body?.score >= 90) {
      console.log("🚨🚨 CRITICAL RED ALERT FOR HUMAN REVIEW 🚨🚨🚨");
      console.log("Time:", new Date().toISOString());
      console.log("User:", req.body.userEmail, req.body.userName, req.body.userId);
      console.log("Text preview:", req.body.text?.slice(0, 150));
      console.log("Category:", req.body.category);
      console.log("Reasons:", req.body.reasons);
      console.log("------------------------------------------------");
      // Later: Add email to shukla.kratitva@gmail.com via nodemailer
    }
    return originalJson.call(this, data);
  };
  next();
};

/* =====================================
   Create Alert
   POST /api/alerts
===================================== */

router.post("/", protect, humanReviewLogger, createAlert);

/* =====================================
   Create RED Alert - Frontend calls this
   POST /api/alerts/red  <-- THIS WAS MISSING, FIXED
===================================== */

router.post("/red", protect, humanReviewLogger, createAlert);

/* =====================================
   Get Current Active Alert
   GET /api/alerts/red
===================================== */

router.get("/red", protect, getRedAlert);

/* =====================================
   Alert History
   GET /api/alerts/history
===================================== */

router.get("/history", protect, getAlertHistory);

/* =====================================
   Call SOS
   POST /api/alerts/call/:id
===================================== */

router.post("/call/:id", protect, callSOS);

/* =====================================
   Clear Alert
   PATCH /api/alerts/clear/:id
===================================== */

router.patch("/clear/:id", protect, clearAlert);

export default router;