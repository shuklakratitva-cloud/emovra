import express from "express";
import { protect as auth } from "../middleware/auth.js";
import PrivateJournal from "../models/PrivateJournal.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const router = express.Router();

function serialize(doc) {
  return {
    _id: doc._id,
    text: decrypt(doc.text_encrypted),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

router.get("/", auth, async (req, res) => {
  try {
    const entries = await PrivateJournal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, entries: entries.map(serialize) });
  } catch (err) {
    console.error("Load private journal error:", err);
    res.status(500).json({ success: false, message: "Failed to load journal" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: "Text required" });

    const entry = await PrivateJournal.create({
      userId: req.user.id,
      text_encrypted: encrypt(text.trim()),
    });
    res.status(201).json({ success: true, entry: serialize(entry) });
  } catch (err) {
    console.error("Save private journal error:", err);
    res.status(500).json({ success: false, message: "Failed to save entry" });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: "Text required" });

    const entry = await PrivateJournal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { text_encrypted: encrypt(text.trim()) },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
    res.json({ success: true, entry: serialize(entry) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update entry" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await PrivateJournal.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete entry" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await PrivateJournal.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to clear journal" });
  }
});

export default router;
