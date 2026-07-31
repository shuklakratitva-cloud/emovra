// backend/data/musicMoods.js
// Deliberately NOT hardcoding specific playlist/video IDs (I can't verify a
// specific track/playlist still exists or is licensed correctly, and
// copying real song titles/lyrics isn't something this app does anywhere
// else either). Instead: mood -> a YouTube SEARCH query URL, which is
// always valid and lets the person pick what actually resonates, plus a
// fully original, license-free ambient soundscape generator (see
// frontend MusicTherapy.jsx) built with the Web Audio API - no copyrighted
// audio involved at all.
export const MUSIC_MOODS = [
  { mood: "calm",     label: "Calm & Grounded",   emoji: "🌊", query: "calm ambient music for relaxation" },
  { mood: "sad",      label: "Sit With It",        emoji: "🌧", query: "gentle sad piano music for processing emotions" },
  { mood: "anxious",  label: "Ease the Nerves",    emoji: "🍃", query: "calming music for anxiety relief" },
  { mood: "sleepy",   label: "Wind Down",          emoji: "🌙", query: "sleep music deep relaxation" },
  { mood: "energize", label: "Gentle Lift",        emoji: "☀️", query: "uplifting instrumental music feel good" },
  { mood: "focus",    label: "Focus & Study",      emoji: "📚", query: "lofi focus study music" },
];
