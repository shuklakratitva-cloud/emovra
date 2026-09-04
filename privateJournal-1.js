import express from "express";
import { protect as auth } from "../middleware/auth.js";
import PrivateJournal from "../models/PrivateJournal.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const router = express.Router();

// Base64 data URLs inflate the raw audio size by ~4/3; this caps the
// encoded string so a single voice note can't blow past the server's
// JSON body-size limit (see server.js) or bloat the DB document.
const MAX_AUDIO_DATA_URL_LENGTH = 3.5 * 1024 * 1024; // ~3.5MB of base64 text

function serialize(doc) {
  return {
    _id: doc._id,
    text: decrypt(doc.text_encrypted),
    audio: doc.audio_encrypted ? decrypt(doc.audio_encrypted) : null,
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
    const { text, audio } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: "Text required" });

    if (audio && typeof audio === "string") {
      if (!audio.startsWith("data:audio/")) {
        return res.status(400).json({ success: false, message: "Invalid voice note" });
      }
      if (audio.length > MAX_AUDIO_DATA_URL_LENGTH) {
        return res.status(400).json({ success: false, message: "Voice note is too long" });
      }
    }

    const entry = await PrivateJournal.create({
      userId: req.user.id,
      text_encrypted: encrypt(text.trim()),
      audio_encrypted: audio && typeof audio === "string" ? encrypt(audio) : undefined,
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
      { returnDocument: "after" }
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
