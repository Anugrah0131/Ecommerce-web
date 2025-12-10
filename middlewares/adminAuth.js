import jwt from "jsonwebtoken";
import User from "../models/user.js";

export default async function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Admin auth error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
