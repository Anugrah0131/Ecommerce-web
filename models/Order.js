import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "guest" },

    shipping: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    items: [
      {
        productId: String,
        title: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],

    paymentMethod: { type: String, default: "cod" },

    amount: Number,

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
