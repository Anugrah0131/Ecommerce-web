import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// --------------------------------------------------------------
// CREATE ORDER
// --------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    const saved = await order.save();

    // return cart for frontend compatibility
    res.status(201).json({
      ...saved._doc,
      cart: saved.items || [],
    });
  } catch (err) {
    res.status(500).json({
      message: "Order creation failed",
      error: err.message,
    });
  }
});

// --------------------------------------------------------------
// GET ORDER BY ID
// --------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // convert items -> cart
    const formattedOrder = {
      ...order._doc,
      cart: order.items || [],
    };

    res.json(formattedOrder);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching order",
      error: err.message,
    });
  }
});

export default router;
