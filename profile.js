import express from "express";
import { protect as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import { THEMES, AVATARS } from "../data/themes.js";
import { MUSIC_MOODS } from "../data/musicMoods.js";

const router = express.Router();

// GET /api/profile/options - catalogs for the settings screen
router.get("/options", (req, res) => {
  res.json({ success: true, themes: Object.values(THEMES), avatars: AVATARS, musicMoods: MUSIC_MOODS });
});

// GET /api/profile/me - current settings + birthday-today check
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name themePreference avatar birthdayMonth birthdayDay personalityResult");
    if (!user) return res.status(404).json({ success: false, message: "Not found" });

    const today = new Date();
    const isBirthdayToday = user.birthdayMonth === today.getMonth() + 1 && user.birthdayDay === today.getDate();

    res.json({
      success: true,
      name: user.name,
      theme: THEMES[user.themePreference] || THEMES["classic-black-gold"],
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

// PATCH /api/profile/settings - update theme/avatar/birthday (never touches
// core account fields like email/password - that stays in routes/auth.js)
router.patch("/settings", auth, async (req, res) => {
  try {
    const { themePreference, avatar, birthdayMonth, birthdayDay } = req.body;
    const update = {};
    if (themePreference && THEMES[themePreference]) update.themePreference = themePreference;
    if (avatar && AVATARS.includes(avatar)) update.avatar = avatar;
    if (birthdayMonth && birthdayMonth >= 1 && birthdayMonth <= 12) update.birthdayMonth = birthdayMonth;
    if (birthdayDay && birthdayDay >= 1 && birthdayDay <= 31) update.birthdayDay = birthdayDay;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("themePreference avatar birthdayMonth birthdayDay");

    res.json({ success: true, theme: THEMES[user.themePreference], avatar: user.avatar, birthdayMonth: user.birthdayMonth, birthdayDay: user.birthdayDay });
  } catch (err) {
    console.error("Profile settings error:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

export default router;
