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

/* =====================================
   Create Alert
   POST /api/alerts
===================================== */

router.post("/", protect, createAlert);

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