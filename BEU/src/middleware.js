import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ message: "No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

const checkRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res
      .status(403)
      .json({ message: `Access denied. Requires ${role} role.` });
  }
  next();
};

const checkRoles = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({
        message: `Access denied. Requires one of the following roles: ${roles.join(
          ", "
        )}.`,
      });
  }
  next();
};

export const checkAdmin = checkRole("admin");
export const checkManager = checkRoles(["admin", "manager"]); // Admins can do what managers can do
export const checkUser = checkRole("user");
