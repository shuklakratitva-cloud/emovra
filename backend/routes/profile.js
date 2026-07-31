import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { THEMES, AVATARS, resolveTheme } from "../data/themes.js";
import { MUSIC_MOODS } from "../data/musicMoods.js";

const router = express.Router();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// GET /api/profile/options - catalogs for the settings screen
router.get("/options", (req, res) => {
  res.json({ success: true, themes: Object.values(THEMES), avatars: AVATARS, musicMoods: MUSIC_MOODS });
});

// GET /api/profile/me - current settings + birthday-today check
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name themePreference customTheme avatar birthdayMonth birthdayDay personalityResult");
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
      birthdayMonth: user.birthdayMonth,
      birthdayDay: user.birthdayDay,
      isBirthdayToday,
      personalityResult: user.personalityResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// PATCH /api/profile/settings - update theme/avatar/birthday/custom colors
// (never touches core account fields like email/password - that stays in
// routes/auth.js)
router.patch("/settings", auth, async (req, res) => {
  try {
    const { themePreference, avatar, birthdayMonth, birthdayDay, customTheme } = req.body;
    const update = {};

    // NEW: custom color picker - validates each value is a real hex color
    // before ever saving it, so a bad value can't corrupt someone's theme.
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
    if (avatar && AVATARS.includes(avatar)) update.avatar = avatar;
    if (birthdayMonth && birthdayMonth >= 1 && birthdayMonth <= 12) update.birthdayMonth = birthdayMonth;
    if (birthdayDay && birthdayDay >= 1 && birthdayDay <= 31) update.birthdayDay = birthdayDay;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("themePreference customTheme avatar birthdayMonth birthdayDay");

    res.json({
      success: true,
      themePreference: user.themePreference,
      theme: resolveTheme(user),
      customTheme: user.customTheme,
      avatar: user.avatar,
      birthdayMonth: user.birthdayMonth,
      birthdayDay: user.birthdayDay,
    });
  } catch (err) {
    console.error("Profile settings error:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

export default router;
