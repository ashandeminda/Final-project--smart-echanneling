import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Verify JWT token — attaches decoded { id, role } to req.user
export const requireSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid Token" });
    }

    // Always resolve current role from DB so stale tokens do not break authz.
    const user = await userModel.findById(userId).select("role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      ...decoded,
      id: userId,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Check if logged-in user has admin role
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
