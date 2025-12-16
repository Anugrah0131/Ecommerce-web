import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

// ==============================
// SIGNUP
// ==============================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ name, email, password: hashed });

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// LOGIN
// ==============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, },
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

export default router;
