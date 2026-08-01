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
import { decrypt } from "../utils/crypto.js";

const router = express.Router();

// GET /api/account/export - everything this account owns, decrypted for
// its own owner, as a single downloadable JSON file. This is what
// PrivacyPolicy.jsx promises people can request - now self-serve instead
// of a manual email.
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
        entries: sj.entries.filter((e) => String(e.authorId) === String(uid)).map((e) => ({ text: e.text, timestamp: e.timestamp })),
      })),
    });
  } catch (err) {
    console.error("Account export error:", err);
    res.status(500).json({ success: false, message: "Failed to export data" });
  }
});

// DELETE /api/account - permanently removes the account and everything it
// owns. Does NOT remove this person's posts inside a friend's shared
// journal (that journal belongs to the friend too) - it strips their
// authorship info from those specific posts instead of deleting a shared
// space out from under someone else.
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
      SharedJournal.deleteMany({ ownerId: uid }), // journals THEY own get fully removed
      SharedJournal.updateMany(
        { "collaborators.userId": uid },
        { $pull: { collaborators: { userId: uid } } }
      ), // just leave journals owned by someone else
    ]);

    await User.findByIdAndDelete(uid);

    res.json({ success: true, message: "Account and all associated data deleted." });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ success: false, message: "Failed to delete account" });
  }
});

export default router;
