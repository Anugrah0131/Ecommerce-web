// =========================
// server.js
// =========================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// =========================
// FIX __dirname (ESM)
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// APP INIT
// =========================
const app = express();

// =========================
// CORE MIDDLEWARES
// =========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================
// REQUEST LOGGER (DEBUG SAVER)
// =========================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// =========================
// MONGOOSE CONNECT (SAFE)
// =========================
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err);
    process.exit(1);
  });

// =========================
// MODELS
// =========================
import Product from "./models/product.js";
import Category from "./models/category.js";

// =========================
// ROUTES
// =========================
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";
import adminOrdersRoutes from "./routes/adminOrders.js";

// =========================
// MULTER CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// =========================
// CATEGORY ROUTES
// =========================
app.get("/api/categories", async (req, res) => {
  try {
    res.json(await Category.find());
  } catch {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    res.json(await new Category(req.body).save());
  } catch {
    res.status(500).json({ message: "Failed to save category" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    res.json(
      await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  } catch {
    res.status(500).json({ message: "Failed to update category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

app.get("/api/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    const products = await Product.find({ category: req.params.id });
    res.json({ category, products });
  } catch {
    res.status(500).json({ message: "Error fetching category" });
  }
});

// =========================
// PRODUCT ROUTES
// =========================
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    res.json(
      category
        ? await Product.find({ category }).populate("category")
        : await Product.find().populate("category")
    );
  } catch {
    res.status(500).json({ message: "Error fetching products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    res.json(await Product.findById(req.params.id).populate("category"));
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    res.json(
      await new Product({
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : "",
      }).save()
    );
  } catch {
    res.status(500).json({ message: "Product create failed" });
  }
});

app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    Object.assign(product, req.body);
    if (req.file) product.image = `/uploads/${req.file.filename}`;
    res.json(await product.save());
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

// =========================
// SEARCH
// =========================
app.get("/api/products/search", async (req, res) => {
  const q = req.query.q || "";
  const results = await Product.find({
    title: { $regex: q, $options: "i" },
  }).limit(8);
  res.json(results);
});

// =========================
// AUTH & ORDER ROUTES (FINAL)
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);

// =========================
// 404 HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// =========================
// SERVER START
// =========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
