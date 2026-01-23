import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";

const router = express.Router();

/* ======================================================
   CREATE ORDER
====================================================== */
router.post("/", async (req, res) => {
  try {
    // ✅ ENFORCE LOGIN (NO MORE "guest" ORDERS)
    if (!req.body.userId) {
      return res.status(401).json({ message: "Login required" });
    }

    console.log("Incoming Order Data:", req.body);

    const order = new Order(req.body);
    const saved = await order.save();

    res.status(201).json(saved);
  } catch (err) {
    console.error("VALIDATION ERROR:", err.message);
    res.status(400).json({
      message: "Order creation failed",
      error: err.message,
    });
  }
});



/* ======================================================
   GET ALL ORDERS FOR USER
   GET /api/orders?userId=xxx
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json([]);
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json([]);
  }
});


/* ======================================================
   GET RECENT ORDERS
   GET /api/orders/recent?userId=xxx
====================================================== */
router.get("/recent", async (req, res) => {
  try {
    const { userId, limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json([]);
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("Fetch recent orders error:", err);
    res.status(500).json([]);
  }
});


/* ======================================================
   GET ORDER BY ID
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      ...order,
      cart: order.items || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
});

export default router;
