import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// FIX: /api/background drives paid image generation (FLUX.1-schnell via
// fal-ai) but had no dedicated limit, so it inherited generalLimiter's
// 100 requests/minute - roughly 144,000 billable generations a day from a
// single signed-up account. Auth alone is not a cost control here. Keyed on
// the authenticated user rather than IP so a shared school network doesn't
// have one student's usage lock out everyone else.
export const imageGenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  // ipKeyGenerator() is required for the IP fallback: express-rate-limit v8
  // rejects a custom keyGenerator that touches req.ip directly, because a
  // raw IPv6 address lets one client rotate through a /64 to bypass limits.
  //
  // FIX: this used to be mounted here as app.use("/api/background", ...),
  // which runs BEFORE the router's own `auth` middleware - so req.user was
  // always undefined at this point and every request silently fell back to
  // the IP key, i.e. exactly the per-IP behaviour the comment above says
  // this limiter exists to avoid. On a shared school network one student
  // generating images would burn the whole building's quota. It is applied
  // inside routes/backgroundGenerate.js after auth instead.
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
  message: {
    success: false,
    message: "Image generation limit reached - please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
