import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import Entry from "../models/Entry.js";
import Alert from "../models/Alert.js";
import PrivateJournal from "../models/PrivateJournal.js";
import SharedJournal from "../models/SharedJournal.js";
import Habit from "../models/Habit.js";
import Goal from "../models/Goal.js";
import SleepLog from "../models/SleepLog.js";
// FIX: these three models were never imported here, so account deletion
// silently left them behind - see the delete handler below.
import SafetyPlan from "../models/SafetyPlan.js";
import ScheduledLetter from "../models/ScheduledLetter.js";
import PushSubscription from "../models/PushSubscription.js";
import { decrypt } from "../utils/crypto.js";

const router = express.Router();

router.get("/export", auth, async (req, res) => {
  try {
    const uid = req.user.id;

    const [user, entries, alerts, journal, habits, goals, sleepLogs, sharedJournals] = await Promise.all([
      User.findById(uid).select("-password"),
      Entry.find({ userId: uid }),
      Alert.find({ userId: uid }),
      PrivateJournal.find({ userId: uid }),
      Habit.find({ userId: uid }),
      Goal.find({ userId: uid }),
      SleepLog.find({ userId: uid }),
      SharedJournal.find({ $or: [{ ownerId: uid }, { "collaborators.userId": uid }] }),
    ]);

    if (!user) return res.status(404).json({ success: false, message: "Not found" });

    const safeDecrypt = (v) => { try { return decrypt(v); } catch { return "[could not decrypt]"; } };

    res.json({
      exportedAt: new Date().toISOString(),
      account: user,
      checkInEntries: entries.map((e) => ({ ...e.toObject(), text: safeDecrypt(e.text_encrypted), text_encrypted: undefined })),
      alerts: alerts.map((a) => ({ ...a.toObject(), text: safeDecrypt(a.text_encrypted), text_encrypted: undefined })),
      personalJournal: journal.map((j) => ({ ...j.toObject(), text: safeDecrypt(j.text_encrypted), text_encrypted: undefined })),
      habits,
      goals,
      sleepLogs,
      sharedJournals: sharedJournals.map((sj) => ({
        title: sj.title,
        role: String(sj.ownerId) === String(uid) ? "owner" : "collaborator",
        // FIX: read `e.text` on a schema whose only text field is
        // `text_encrypted` (and which, unlike Goal/Habit, defines no
        // decrypting getter). It was always undefined, so JSON.stringify
        // dropped the key entirely and every shared-journal entry exported
        // as a bare timestamp with no content - a silently incomplete
        // data-portability export.
        entries: sj.entries.filter((e) => String(e.authorId) === String(uid)).map((e) => ({ text: safeDecrypt(e.text_encrypted), timestamp: e.timestamp })),
      })),
    });
  } catch (err) {
    console.error("Account export error:", err);
    res.status(500).json({ success: false, message: "Failed to export data" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const uid = req.user.id;

    await Promise.all([
      Entry.deleteMany({ userId: uid }),
      Alert.deleteMany({ userId: uid }),
      PrivateJournal.deleteMany({ userId: uid }),
      Habit.deleteMany({ userId: uid }),
      Goal.deleteMany({ userId: uid }),
      SleepLog.deleteMany({ userId: uid }),
      SharedJournal.deleteMany({ ownerId: uid }),
      SharedJournal.updateMany(
        { "collaborators.userId": uid },
        { $pull: { collaborators: { userId: uid } } }
      ),
      // FIX: SafetyPlan, ScheduledLetter and PushSubscription were all
      // missing here, so "Account and all associated data deleted" was not
      // true. The safety plan is the worst omission - it holds encrypted
      // warning signs, coping strategies, support contacts and reasons to
      // live, i.e. the most sensitive content in the app - and unlike
      // Entry/Alert none of these models has a TTL index, so the orphaned
      // documents persisted indefinitely with no UI left to reach them.
      SafetyPlan.deleteMany({ userId: uid }),
      ScheduledLetter.deleteMany({ userId: uid }),
      PushSubscription.deleteMany({ userId: uid }),
    ]);

    await User.findByIdAndDelete(uid);

    res.json({ success: true, message: "Account and all associated data deleted." });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ success: false, message: "Failed to delete account" });
  }
});

export default router;
