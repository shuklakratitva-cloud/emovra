import express from "express";
import webpush from "web-push";
import { protect as auth } from "../middleware/auth.js";
import FollowUp from "../models/FollowUp.js";
import PushSubscription from "../models/PushSubscription.js";

const router = express.Router();

// GET /api/follow-up/due
// The one check-back that is currently owed to this student, or null.
// Returns at most one even if several exist, so the UI can never turn into
// a backlog of prompts.
router.get("/due", auth, async (req, res) => {
  try {
    const followUp = await FollowUp.findOne({
      userId: req.user.id,
      status: "pending",
      dueAt: { $lte: new Date() },
    }).sort({ dueAt: 1 });

    if (!followUp) return res.json({ success: true, followUp: null });

    // Only the id and timing go to the client. Nothing about the original
    // disclosure is sent, on purpose - see the note in models/FollowUp.js.
    res.json({
      success: true,
      followUp: { _id: followUp._id, dueAt: followUp.dueAt },
    });
  } catch (err) {
    console.error("Follow-up due error:", err.message);
    res.status(500).json({ success: false, message: "Could not load follow-up" });
  }
});

// POST /api/follow-up/:id/respond   body: { response: "better"|"same"|"worse" }
router.post("/:id/respond", auth, async (req, res) => {
  try {
    const { response } = req.body;
    if (!["better", "same", "worse"].includes(response)) {
      return res.status(400).json({ success: false, message: "Invalid response" });
    }

    // Scoped to the caller so an id from someone else's account can never
    // be answered - same rule every other :id route here follows.
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: "pending" },
      { status: "answered", response, respondedAt: new Date() },
      { new: true }
    );
    if (!followUp) {
      return res.status(404).json({ success: false, message: "Follow-up not found" });
    }

    console.log(`[FOLLOWUP-ANSWERED] ${response} User:${req.user.id}`);

    // "worse" is the whole reason this feature exists: it is the app
    // learning, a day later, that things did not improve. The client uses
    // this flag to re-surface helplines and the student's emergency
    // contact. It is deliberately NOT auto-escalated to the admin panel -
    // answering honestly must not feel like triggering a report, or the
    // honest answer stops being given. The student is offered the way to
    // reach a human and chooses.
    res.json({ success: true, showSupport: response === "worse" });
  } catch (err) {
    console.error("Follow-up respond error:", err.message);
    res.status(500).json({ success: false, message: "Could not save your answer" });
  }
});

// POST /api/follow-up/:id/dismiss - "not now", no answer recorded.
router.post("/:id/dismiss", auth, async (req, res) => {
  try {
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: "pending" },
      { status: "dismissed" },
      { new: true }
    );
    if (!followUp) {
      return res.status(404).json({ success: false, message: "Follow-up not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Follow-up dismiss error:", err.message);
    res.status(500).json({ success: false, message: "Could not dismiss" });
  }
});

// POST /api/follow-up/send-due
// Cron-only, same X-Cron-Secret pattern as push.js and letters.js: no user
// auth, fails closed when the secret isn't configured. Sends one push per
// due follow-up so the check-back reaches a student who hasn't opened the
// app - which is precisely the student it most needs to reach.
router.post("/send-due", async (req, res) => {
  try {
    const providedSecret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return res.status(503).json({ success: false, message: "Push not configured (missing VAPID keys)" });
    }
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT_EMAIL || process.env.ADMIN_ALERT_EMAIL || "emovracares@gmail.com"}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const due = await FollowUp.find({
      status: "pending",
      dueAt: { $lte: new Date() },
      notifiedAt: null,
    }).limit(200);

    let sent = 0, cleaned = 0;
    for (const followUp of due) {
      const subs = await PushSubscription.find({ userId: followUp.userId });
      // Mark as notified even with no subscription, so a student who has
      // push turned off isn't retried on every cron run forever. The card
      // still waits for them inside the app.
      followUp.notifiedAt = new Date();
      await followUp.save();
      if (!subs.length) continue;

      // Wording carries no hint of what was written - a push notification
      // is readable on a lock screen, possibly by whoever the student was
      // writing about.
      const payload = JSON.stringify({
        title: "Emovra",
        body: "Just checking in on you today. No pressure to say much.",
        url: "/app",
      });

      for (const sub of subs) {
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
    }

    console.log(`[FOLLOWUP-CRON] ${due.length} due, ${sent} pushes sent, ${cleaned} dead subs cleaned`);
    res.json({ success: true, due: due.length, sent, cleaned });
  } catch (err) {
    console.error("Follow-up cron error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
