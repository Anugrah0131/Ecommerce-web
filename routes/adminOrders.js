import express from "express";
import mongoose from "mongoose";
import adminAuth from "../middlewares/adminAuth.js";
import Order from "../models/Order.js";

const router = express.Router();

const STATUS_FLOW = [
  "Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

/* ================================
   GET ALL ORDERS (ADMIN)
================================ */
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean(); // analytics + table fast

    res.status(200).json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

/* ================================
   UPDATE ORDER STATUS (ADMIN)
================================ */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ✅ Prevent backward or invalid jumps
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const nextIndex = STATUS_FLOW.indexOf(status);

    if (nextIndex < currentIndex) {
      return res.status(400).json({
        message: "Invalid status transition",
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({
      message: "Failed to update status",
    });
  }
});

export default router;
