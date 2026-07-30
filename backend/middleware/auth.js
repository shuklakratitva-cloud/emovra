import jwt from "jsonwebtoken";

// STRICT auth - rejects requests with no/invalid token.
// Use this for routes that must know who the user is (data.js, alert.js, admin.js, voice.js).
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ msg: "No token, auth denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.user = decoded; // now includes { id, role } - see routes/auth.js
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token invalid" });
  }
}

export default authMiddleware;
export const auth = authMiddleware;
export const protect = authMiddleware;
export const authenticate = authMiddleware;
