const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) { req.user = null; return next(); }
  try { req.user = jwt.verify(header.split(" ")[1], JWT_SECRET); } catch { req.user = null; }
  next();
}

module.exports = { authenticate, optionalAuth };
