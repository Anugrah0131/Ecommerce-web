import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import Order from "../models/Order.js";

const router = express.Router();

// GET all orders
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// UPDATE order status
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;
