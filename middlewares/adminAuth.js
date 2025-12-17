import jwt from "jsonwebtoken";
import User from "../models/user.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // ✅ support both id & userId
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (user.isAdmin !== true) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.user = user; // for audit / logs
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export default adminAuth;
