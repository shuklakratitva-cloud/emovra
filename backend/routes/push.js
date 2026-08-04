import express from "express";
import webpush from "web-push";
import { protect as auth } from "../middleware/auth.js";
import PushSubscription from "../models/PushSubscription.js";
import User from "../models/User.js";
import { todayIST } from "../utils/istDate.js";

const router = express.Router();

// ============================================================
// PUSH NOTIFICATIONS
//
// REQUIRED ENV VARS:
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY - the app's push identity. A
//     working pair is provided in CHANGES.md for you to use immediately,
//     or generate your own anytime with `npx web-push generate-vapid-keys`
//     if you'd rather nobody else has ever seen the private key.
//   VAPID_CONTACT_EMAIL - optional, defaults to the admin alert email -
//     required by the Web Push spec so browser vendors can contact you if
//     your server ever misbehaves, not shown to users.
//
// Like the weekly digest, actually SENDING reminders needs an external
// free cron trigger (Render's free tier has no built-in scheduler) - see
// CHANGES.md for setup.
// ============================================================

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || process.env.ADMIN_ALERT_EMAIL || "shukla.kratitva@gmail.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
  return true;
}

// GET /api/push/vapid-public-key - frontend needs this to subscribe
router.get("/vapid-public-key", (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, message: "Push notifications aren't configured yet" });
  }
  res.json({ success: true, key: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: "Invalid subscription" });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user.id, endpoint, keys },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save subscription" });
  }
});

// POST /api/push/unsubscribe
router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove subscription" });
  }
});

// POST /api/push/send-daily-reminder - triggered by external free cron,
// same CRON_SECRET pattern as the weekly digest. Sends a gentle check-in
// nudge to everyone with an active subscription who hasn't checked in
// today yet (uses the same lastMoodCheckinDate signal the challenge
// verification system already tracks - no new tracking needed).
router.post("/send-daily-reminder", async (req, res) => {
  try {
    const providedSecret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!ensureVapid()) {
      return res.status(503).json({ success: false, message: "Push notifications aren't configured (missing VAPID keys)" });
    }

    const today = todayIST();
    const subs = await PushSubscription.find().populate("userId", "lastMoodCheckinDate");

    let sent = 0, cleaned = 0;
    for (const sub of subs) {
      if (!sub.userId || sub.userId.lastMoodCheckinDate === today) continue; // already checked in today

      const payload = JSON.stringify({
        title: "Emovra",
        body: "A quiet moment to check in with yourself, whenever you're ready.",
        url: "/app",
      });

      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // subscription is dead (browser cleared it, uninstalled, etc.) - clean it up
          await PushSubscription.deleteOne({ _id: sub._id });
          cleaned++;
        }
      }
    }

    console.log(`[PUSH-REMINDER] Sent ${sent}, cleaned up ${cleaned} dead subscriptions`);
    res.json({ success: true, sent, cleaned });
  } catch (err) {
    console.error("Push reminder error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
