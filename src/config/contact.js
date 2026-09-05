// Public contact address shown on the landing page, privacy policy and
// terms. Kept here rather than repeated in each page so the address can
// never drift between what the Privacy Policy promises and where mail
// actually goes. Mirrors backend/utils/supportEmail.js.
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "emovracares@gmail.com";
export default SUPPORT_EMAIL;
