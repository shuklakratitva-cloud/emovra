import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ msg: "No token, auth denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token invalid" });
  }
}

// Export for ALL cases
export default authMiddleware;
export const auth = authMiddleware;
export const protect = authMiddleware;
export const authenticate = authMiddleware;