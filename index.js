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

// MODELS
import product from "./model/product.js";
import category from "./model/category.js";

// ROUTES (Auth)
import authRoutes from "./routes/auth.js";

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// =========================
// MONGOOSE CONNECT
// =========================
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// =========================
// MULTER CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // create uploads folder if missing
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// =========================
// CATEGORY ROUTES
// =========================

// GET all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categoriesList = await category.find();
    res.json(categoriesList);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", err });
  }
});

// CREATE category
app.post("/api/categories", async (req, res) => {
  try {
    const newCategory = new category(req.body);
    const saved = await newCategory.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to save category", err });
  }
});

// UPDATE category
app.put("/api/categories/:id", async (req, res) => {
  try {
    const updated = await category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category", err });
  }
});

// DELETE category
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const deleted = await category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting category", err });
  }
});

// GET category with its products
app.get("/api/categories/:id", async (req, res) => {
  try {
    const cat = await category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const productsList = await product.find({ category: req.params.id });
    res.json({ category: cat, products: productsList });
  } catch (err) {
    res.status(500).json({ message: "Error fetching category", err });
  }
});

// =========================
// PRODUCT ROUTES
// =========================

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    let productsList;
    if (category) {
      productsList = await product.find({ category }).populate("category");
    } else {
      productsList = await product.find().populate("category");
    }
    res.json(productsList);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", err });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const prod = await product.findById(req.params.id).populate("category");
    if (!prod) return res.status(404).json({ message: "Product not found" });
    res.json(prod);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", err });
  }
});

// CREATE product
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;
    const newProduct = new product({
      title,
      price,
      category,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });
    const saved = await newProduct.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to save product", err });
  }
});

// UPDATE product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;

    const prod = await product.findById(req.params.id);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    prod.title = title || prod.title;
    prod.price = price || prod.price;
    prod.category = category || prod.category;
    prod.description = description || prod.description;

    // Handle image upload
    if (req.file) {
      // Delete old image
      if (prod.image) {
        const oldPath = path.join(process.cwd(), "uploads", path.basename(prod.image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      prod.image = `/uploads/${req.file.filename}`;
    }

    const updated = await prod.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", err });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    // Delete image from server
    if (deleted.image) {
      const imgPath = path.join(process.cwd(), "uploads", path.basename(deleted.image));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", err });
  }
});

// LIVE SEARCH
app.get("/api/products/search", async (req, res) => {
  try {
    const q = req.query.q;
    const results = await product.find({
      title: { $regex: q, $options: "i" },
    }).limit(7);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Search failed", err });
  }
});

// =========================
// AUTH ROUTES
// =========================
app.use("/api/auth", authRoutes);

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
