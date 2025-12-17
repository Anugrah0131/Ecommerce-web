import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  image: { 
    type: String, 
    required: true 
  },
  /* UPGRADE: Adding a 'categoryName' string field. 
     This allows the search to work instantly without complex "joins" (lookups) 
     between collections, which is much faster for live search.
  */
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  categoryName: { 
    type: String, 
    required: true, // Sync this when you save a product
    index: true 
  },
  description: {
    type: String,
    trim: true
  },
  inStock: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

/* INTENSE FEATURE: COMPOUND TEXT INDEX
   This allows MongoDB to search 'title', 'categoryName', and 'description' 
   all at once with high performance.
*/
productSchema.index({ 
  title: "text", 
  categoryName: "text", 
  description: "text" 
}, {
  weights: {
    title: 10,       // Title matches are most important
    categoryName: 5, // Category matches are medium importance
    description: 2   // Description matches are lowest importance
  },
  name: "ProductSearchIndex"
});

const Product = mongoose.model("Product", productSchema);

export default Product;