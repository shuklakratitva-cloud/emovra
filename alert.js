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
      console.log("🚨🚨 CRITICAL RED ALERT FOR HUMAN REVIEW 🚨🚨🚨");
      console.log("Time:", new Date().toISOString());
      console.log("User:", req.body.userEmail, req.body.userName, req.body.userId);
      console.log("Text preview:", req.body.text?.slice(0, 150));
      console.log("Category:", req.body.category);
      console.log("Reasons:", req.body.reasons);
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
