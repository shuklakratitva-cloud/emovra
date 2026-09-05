// The single address students and the app write to.
//
// FIX: this used to be the developer's personal Gmail hardcoded in four
// separate places (feedback.js, alertEmail.js, push.js's VAPID contact,
// and three user-facing pages), which meant privacy requests, crisis-system
// alerts and general feedback all landed in one personal inbox with no way
// to hand any of it over. One definition, overridable per-environment.
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "emovracares@gmail.com";
export default SUPPORT_EMAIL;
