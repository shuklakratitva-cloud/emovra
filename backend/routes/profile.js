import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { THEMES, AVATARS, resolveTheme } from "../data/themes.js";
import { MUSIC_MOODS } from "../data/musicMoods.js";

const router = express.Router();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const ACCESSORIES = [
  { emoji: "🎩", minLevel: 3, name: "Top Hat" },
  { emoji: "🕶️", minLevel: 5, name: "Sunglasses" },
  { emoji: "👑", minLevel: 8, name: "Crown" },
  { emoji: "🎀", minLevel: 12, name: "Bow" },
  { emoji: "✨", minLevel: 16, name: "Sparkle" },
];

const MAX_AVATAR_DATA_URI_LENGTH = 280000;
const MAX_BACKGROUND_DATA_URI_LENGTH = 4000000;

router.get("/options", (req, res) => {
  res.json({ success: true, themes: Object.values(THEMES), avatars: AVATARS, musicMoods: MUSIC_MOODS, accessories: ACCESSORIES });
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name themePreference customTheme avatar avatarType avatarImage avatarAccessory backgroundImage level birthdayMonth birthdayDay personalityResult");
    if (!user) return res.status(404).json({ success: false, message: "Not found" });

    const today = new Date();
    const isBirthdayToday = user.birthdayMonth === today.getMonth() + 1 && user.birthdayDay === today.getDate();

    res.json({
      success: true,
      name: user.name,
      themePreference: user.themePreference,
      theme: resolveTheme(user),
      customTheme: user.customTheme,
      avatar: user.avatar,
      avatarType: user.avatarType,
      avatarImage: user.avatarType === "custom" ? user.avatarImage : "",
      avatarAccessory: user.avatarAccessory || "",
      backgroundImage: user.backgroundImage || "",
      level: user.level || 1,
      birthdayMonth: user.birthdayMonth,
      birthdayDay: user.birthdayDay,
      isBirthdayToday,
      personalityResult: user.personalityResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

router.patch("/settings", auth, async (req, res) => {
  try {
    const { themePreference, avatar, avatarImage, avatarAccessory, birthdayMonth, birthdayDay, customTheme, backgroundImage, removeBackgroundImage } = req.body;
    const update = {};

    if (customTheme && typeof customTheme === "object") {
      const c = {};
      if (customTheme.bg && HEX_RE.test(customTheme.bg)) c.bg = customTheme.bg;
      if (customTheme.card && HEX_RE.test(customTheme.card)) c.card = customTheme.card;
      if (customTheme.accent && HEX_RE.test(customTheme.accent)) c.accent = customTheme.accent;
      if (Object.keys(c).length > 0) {
        update.customTheme = c;
        update.themePreference = "custom";
      }
    }

    if (themePreference && (THEMES[themePreference] || themePreference === "custom")) {
      update.themePreference = themePreference;
    }

    if (avatarImage && typeof avatarImage === "string") {
      const isDataUri = /^data:image\/(png|jpe?g|webp);base64,/.test(avatarImage);
      if (!isDataUri) {
        return res.status(400).json({ success: false, message: "Invalid image format" });
      }
      if (avatarImage.length > MAX_AVATAR_DATA_URI_LENGTH) {
        return res.status(400).json({ success: false, message: "Image too large - please use a smaller photo" });
      }
      update.avatarImage = avatarImage;
      update.avatarType = "custom";
    } else if (avatar && AVATARS.includes(avatar)) {

      update.avatar = avatar;
      update.avatarType = "emoji";
    }

    if (backgroundImage && typeof backgroundImage === "string") {
      const isDataUri = /^data:image\/(png|jpe?g|webp);base64,/.test(backgroundImage);
      if (!isDataUri) {
        return res.status(400).json({ success: false, message: "Invalid image format" });
      }
      if (backgroundImage.length > MAX_BACKGROUND_DATA_URI_LENGTH) {
        return res.status(400).json({ success: false, message: "Image too large - please use a smaller image" });
      }
      update.backgroundImage = backgroundImage;
    } else if (removeBackgroundImage) {
      update.backgroundImage = "";
    }

    // NEW: avatar accessory - level-gated, checked server-side (not just
    // hidden in the UI) so someone can't unlock one early by just calling
    // the API directly.
    if (typeof avatarAccessory === "string") {
      if (avatarAccessory === "") {
        update.avatarAccessory = ""; // allow removing it
      } else {
        const currentUser = await User.findById(req.user.id).select("level");
        const unlocked = ACCESSORIES.find((a) => a.emoji === avatarAccessory && (currentUser?.level || 1) >= a.minLevel);
        if (!unlocked) {
          return res.status(403).json({ success: false, message: "That accessory isn't unlocked yet." });
        }
        update.avatarAccessory = avatarAccessory;
      }
    }

    if (birthdayMonth && birthdayMonth >= 1 && birthdayMonth <= 12) update.birthdayMonth = birthdayMonth;
    if (birthdayDay && birthdayDay >= 1 && birthdayDay <= 31) update.birthdayDay = birthdayDay;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("themePreference customTheme avatar avatarType avatarImage avatarAccessory backgroundImage level birthdayMonth birthdayDay");

    res.json({
      success: true,
      themePreference: user.themePreference,
      theme: resolveTheme(user),
      customTheme: user.customTheme,
      avatar: user.avatar,
      avatarType: user.avatarType,
      avatarImage: user.avatarType === "custom" ? user.avatarImage : "",
      avatarAccessory: user.avatarAccessory || "",
      backgroundImage: user.backgroundImage || "",
      level: user.level || 1,
      birthdayMonth: user.birthdayMonth,
      birthdayDay: user.birthdayDay,
    });
  } catch (err) {
    console.error("Profile settings error:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

export default router;
