import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import product from "./model/product.js";
import category from "./model/category.js";

const app = express();

// CORS setup
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ DATABASE CONNECTED"))
  .catch((err) => console.error("❌ DATABASE CONNECTION ERROR:", err));

/* ------------------ PRODUCTS ------------------ */

// Add Product
app.post("/api/products", async (req, res) => {
  try {
    const { title, price, image, category: catId } = req.body;
    if (!title || !price || !image) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newProduct = await product.create({ title, price, image, category: catId });
    res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (err) {
    console.error("POST error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await product.find().populate("category");
    res.status(200).json(products);
  } catch (err) {
    console.error("GET error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete Product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found." });
    res.status(200).json({ message: "Product deleted successfully!", deleted });
  } catch (err) {
    console.error("DELETE error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ------------------ CATEGORIES ------------------ */

// Add Category
app.post("/api/categories", async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name || !description || !image) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newCategory = await category.create({ name, description, image });
    res.status(201).json({ message: "Category added successfully!", category: newCategory });
  } catch (err) {
    console.error("POST error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all Categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error("GET error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single category + its products
app.get("/api/categories/:id", async (req, res) => {
  try {
    const foundCategory = await category.findById(req.params.id);
    if (!foundCategory) return res.status(404).json({ message: "Category not found" });
    const products = await product.find({ category: req.params.id });
    res.json({ category: foundCategory, products });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Category
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const deleted = await category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found." });
    res.status(200).json({ message: "Category deleted successfully!", deleted });
  } catch (err) {
    console.error("DELETE error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
