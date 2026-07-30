import jwt from "jsonwebtoken";

// Like auth.js, but never rejects - just attaches req.user if a valid token
// is present, otherwise continues as anonymous.
//
// Why: analyze.js's /api/analyze and gemini.js's /api/chat were previously
// always anonymous, so the "userId" saved on entries/alerts often wasn't a
// real Mongo user id - meaning admin.js's `.populate("userId", "name email
// ...")` had nothing to populate, and the person's identity/emergency
// contact never showed up even for a RED message. This lets those routes
// capture the real logged-in user WHEN a token is sent, without forcing
// every caller to be authenticated.
export default function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.id;
    } catch {
      // invalid/expired token - proceed as anonymous rather than 401ing
    }
  }
  next();
}
