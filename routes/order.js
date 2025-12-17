import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";

const router = express.Router();

/* ======================================================
   CREATE ORDER
   POST /api/orders
====================================================== */
router.post("/", async (req, res) => {
  try {
    console.log("Incoming Order Data:", req.body); // Check if userId is "guest" here
    const order = new Order(req.body);
    const saved = await order.save();
    
    res.status(201).json(saved);
  } catch (err) {
    console.error("VALIDATION ERROR:", err.message);
    res.status(400).json({ 
      message: "Order creation failed", 
      error: err.message // This will tell you exactly which field failed
    });
  }
});

/* ======================================================
   GET ORDER BY ID
   GET /api/orders/:id
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Avoid mongoose CastError → HTML response
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      ...order,
      cart: order.items || [],
    });
  } catch (err) {
    console.error("Fetch order error:", err);
    res.status(500).json({
      message: "Error fetching order",
    });
  }
});

export default router;
