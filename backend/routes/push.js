import express from "express";
import webpush from "web-push";
import { protect as auth } from "../middleware/auth.js";
import PushSubscription from "../models/PushSubscription.js";
import User from "../models/User.js";
import { todayIST } from "../utils/istDate.js";

const router = express.Router();

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

router.get("/vapid-public-key", (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, message: "Push notifications aren't configured yet" });
  }
  res.json({ success: true, key: process.env.VAPID_PUBLIC_KEY });
});

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

router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove subscription" });
  }
});

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
      if (!sub.userId || sub.userId.lastMoodCheckinDate === today) continue;

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
