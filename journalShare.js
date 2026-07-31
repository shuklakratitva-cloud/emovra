import express from "express";
import crypto from "crypto";
import SharedJournal from "../models/SharedJournal.js";
import { protect as auth } from "../middleware/auth.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { awardXP } from "../utils/gamification.js";

const router = express.Router();

function generateInviteCode() {
  // short, shareable, not easily guessable
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
}

function hasAccess(journal, userId) {
  const uid = String(userId);
  if (String(journal.ownerId) === uid) return true;
  return journal.collaborators.some((c) => String(c.userId) === uid);
}

function serialize(journal) {
  return {
    _id: journal._id,
    title: journal.title,
    inviteCode: journal.inviteCode,
    ownerId: journal.ownerId,
    collaborators: journal.collaborators,
    entries: journal.entries.map((e) => ({
      _id: e._id,
      authorId: e.authorId,
      authorName: e.authorName,
      text: decrypt(e.text_encrypted),
      timestamp: e.timestamp,
    })),
    createdAt: journal.createdAt,
  };
}

// POST /api/journal-share/create - start a new shared journal, get an invite code back
router.post("/create", auth, async (req, res) => {
  try {
    const { title } = req.body;
    let inviteCode = generateInviteCode();
    // extremely unlikely, but guard against collision
    let existing = await SharedJournal.findOne({ inviteCode });
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await SharedJournal.findOne({ inviteCode });
    }

    const journal = await SharedJournal.create({
      ownerId: req.user.id,
      title: title?.trim() || "Our Journal",
      inviteCode,
      collaborators: [],
      entries: [],
    });

    // FIX (vulnerability): previously awarded XP on every single call to
    // this endpoint with no limit - a script could loop this and farm
    // unlimited XP. Now only pays out for the person's first-ever shared
    // journal (whether owned or joined).
    const priorCount = await SharedJournal.countDocuments({
      $or: [{ ownerId: req.user.id }, { "collaborators.userId": req.user.id }],
    });
    if (priorCount <= 1) {
      await awardXP(req.user.id, 8, { sharedJournal: true });
    }

    res.status(201).json({ success: true, journal: serialize(journal) });
  } catch (err) {
    console.error("Create shared journal error:", err);
    res.status(500).json({ success: false, message: "Failed to create shared journal" });
  }
});

// POST /api/journal-share/join - join someone else's journal with their invite code
router.post("/join", auth, async (req, res) => {
  try {
    const { inviteCode, name } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: "Invite code required" });

    const journal = await SharedJournal.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!journal) return res.status(404).json({ success: false, message: "Invalid invite code" });

    if (String(journal.ownerId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "You already own this journal" });
    }

    const already = journal.collaborators.some((c) => String(c.userId) === String(req.user.id));
    if (!already) {
      journal.collaborators.push({ userId: req.user.id, name: name || "" });
      await journal.save();
      await awardXP(req.user.id, 8, { sharedJournal: true }); // FIX: moved inside this block - was previously outside, awarding on every call regardless of whether this was a real new join
    }

    res.json({ success: true, journal: serialize(journal) });
  } catch (err) {
    console.error("Join shared journal error:", err);
    res.status(500).json({ success: false, message: "Failed to join shared journal" });
  }
});

// GET /api/journal-share/mine - every shared journal you own or collaborate on
router.get("/mine", auth, async (req, res) => {
  try {
    const journals = await SharedJournal.find({
      $or: [{ ownerId: req.user.id }, { "collaborators.userId": req.user.id }],
    }).sort({ updatedAt: -1 });

    res.json({ success: true, journals: journals.map(serialize) });
  } catch (err) {
    console.error("List shared journals error:", err);
    res.status(500).json({ success: false, message: "Failed to load shared journals" });
  }
});

// GET /api/journal-share/:id - full thread (owner or collaborator only)
router.get("/:id", auth, async (req, res) => {
  try {
    const journal = await SharedJournal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: "Not found" });
    if (!hasAccess(journal, req.user.id)) {
      return res.status(403).json({ success: false, message: "You don't have access to this journal" });
    }
    res.json({ success: true, journal: serialize(journal) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load journal" });
  }
});

// POST /api/journal-share/:id/entry - add an entry (owner or collaborator only)
router.post("/:id/entry", auth, async (req, res) => {
  try {
    const { text, authorName } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: "Text required" });

    const journal = await SharedJournal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: "Not found" });
    if (!hasAccess(journal, req.user.id)) {
      return res.status(403).json({ success: false, message: "You don't have access to this journal" });
    }

    journal.entries.push({
      authorId: req.user.id,
      authorName: authorName || "",
      text_encrypted: encrypt(text.trim()),
    });
    await journal.save();
    await awardXP(req.user.id, 6, {});

    res.status(201).json({ success: true, journal: serialize(journal) });
  } catch (err) {
    console.error("Add shared entry error:", err);
    res.status(500).json({ success: false, message: "Failed to add entry" });
  }
});

// DELETE /api/journal-share/:id/leave - collaborator leaves (owner cannot leave, only delete - not implemented, keep it simple/safe)
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const journal = await SharedJournal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: "Not found" });
    journal.collaborators = journal.collaborators.filter((c) => String(c.userId) !== String(req.user.id));
    await journal.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to leave journal" });
  }
});

export default router;
