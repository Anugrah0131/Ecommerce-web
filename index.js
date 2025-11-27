import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// MODELS
import product from "./model/product.js";
import category from "./model/category.js";

// MULTER
import upload from "./multer.js";

import authRoutes from "./routes/auth.js";


const app = express();

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// =====================================================
// CONNECT MONGODB
// =====================================================
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


// =====================================================
// CATEGORY ROUTES
// =====================================================

// GET all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categoriesList = await category.find();
    res.json(categoriesList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching categories", error });
  }
});

// CREATE category (with image)
app.post("/api/categories", upload.single("image"), async (req, res) => {
  try {
    const newCategory = new category({
      name: req.body.name,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const saved = await newCategory.save();
    res.json(saved);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to save category", err });
  }
});

// UPDATE category (supports new image)
app.put("/api/categories/:id", upload.single("image"), async (req, res) => {
  try {
    let updateData = { name: req.body.name };

    // If a new image is uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update category", error });
  }
});

// DELETE category
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const deleted = await category.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
});

// GET category + its products
app.get("/api/categories/:id", async (req, res) => {
  try {
    const categoryData = await category.findById(req.params.id);

    if (!categoryData)
      return res.status(404).json({ message: "Category not found" });

    const productsList = await product.find({ category: req.params.id });

    res.json({ category: categoryData, products: productsList });
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error });
  }
});


// =====================================================
// PRODUCT ROUTES
// =====================================================

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const productsList = await product.find().populate("category");
    res.json(productsList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// CREATE product
app.post("/api/products",upload.single('image'), async (req, res) => {
  try {
    const newProduct = new product(req.body);

    if (req.file) {
      const fullUrl = req.protocol + "://" + req.get("host");
      newProduct.image = `${fullUrl}/uploads/${req.file.filename}`;
    }

    const saved = await newProduct.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to save product", err });
  }
});

// UPDATE product with image support
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      price: req.body.price,
      category: req.body.category,
    };

    // If a new image is uploaded, save it
    if (req.file) {
      const fullUrl = req.protocol + "://" + req.get("host");
      updateData.image = `${fullUrl}/uploads/${req.file.filename}`;
    }

    const updatedProduct = await product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", err });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await product.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const singleProduct = await product.findById(req.params.id).populate("category");

    if (!singleProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(singleProduct);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// LIVE SEARCH
app.get("/api/products/search", async (req, res) => {
  try {
    const q = req.query.q;

    const products = await product.find({
      title: { $regex: q, $options: "i" },
    }).limit(7);

    res.json(products);
  } catch (error) {
    console.log("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

 app.use("/api/auth", authRoutes);

// =====================================================
// START SERVER
// =====================================================
console.log("ENV MONGO_DB =", process.env.MONGO_DB);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});