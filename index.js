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
// FIX __dirname FOR ES MODULE
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// APP INIT
// =========================
const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// =========================
// MONGOOSE CONNECT
// =========================
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

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
import adminAuth from "./middlewares/adminAuth.js";

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

// GET all categories
app.get("/api/categories", async (req, res) => {
  try {
    const list = await Category.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// CREATE category
app.post("/api/categories", async (req, res) => {
  try {
    const saved = await new Category(req.body).save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to save category" });
  }
});

// UPDATE category
app.put("/api/categories/:id", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
});

// DELETE category
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting category" });
  }
});

// GET category with products
app.get("/api/categories/:id", async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: req.params.id });
    res.json({ category: cat, products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching category" });
  }
});

// =========================
// PRODUCT ROUTES
// =========================

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const list = category
      ? await Product.find({ category }).populate("category")
      : await Product.find().populate("category");

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id).populate("category");
    if (!prod) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(prod);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product" });
  }
});

// CREATE product
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;

    const saved = await new Product({
      title,
      price,
      category,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    }).save();

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to save product" });
  }
});

// UPDATE product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(prod, req.body);

    if (req.file) {
      if (prod.image) {
        const oldPath = path.join(__dirname, "uploads", path.basename(prod.image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      prod.image = `/uploads/${req.file.filename}`;
    }

    const updated = await prod.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (deleted.image) {
      const imgPath = path.join(__dirname, "uploads", path.basename(deleted.image));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

// UPGRADED LIVE SEARCH (Perfectly synced with SearchResults.jsx)
app.get("/api/products/search", async (req, res) => {
  try {
    const { q } = req.query;

    const results = await Product.find(
      { $text: { $search: q } }, 
      { score: { $meta: "textScore" } } // Calculate how well it matches
    )
    .sort({ score: { $meta: "textScore" } }) // Sort by best match first
    .limit(8)
    .select("title price image categoryName");

    res.json(results);
  } catch (err) {
    // Fallback to Regex if Text Search fails or is empty
    const results = await Product.find({
      title: { $regex: q, $options: "i" }
    }).limit(8);
    res.json(results);
  }
});

// =========================
// AUTH & ORDER ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);          // user + guest
app.use("/api/orders", adminOrdersRoutes);    // admin (GET / PATCH)

// =========================
// 404 JSON FALLBACK (VERY IMPORTANT)
// =========================
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
