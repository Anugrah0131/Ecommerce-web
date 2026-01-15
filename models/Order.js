import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
}
,
    /* ================= SHIPPING ================= */
    shipping: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    /* ================= ITEMS ================= */
    items: [
      {
        productId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, default: "" },
      },
    ],

    /* ================= PAYMENT ================= */
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "stripe"],
      default: "cod",
    },

    /* ================= AMOUNT ================= */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: [
        "Placed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
      ],
      default: "Placed",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", OrderSchema);
