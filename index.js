import dotenv from "dotenv"
dotenv.config()


import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import product from "./model/product";

const app=express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_DB).then(()=>console.log("DATABASE CONNECTED"))
let products = ["gg"];

app.post("/api/products",(req,res)=>{
     const { title,price,image } =req.body;

     if (!title || !price || !image){
        return res.status(400).json({message: "All fields are required."});
     }

     const newProduct = { title,price,image};
     product.create({ title:title,price:price,image:image})

     res.status(201).json({
        message: "product added successfully!",
        product: newProduct,
     });

});

app.get("api/products", async (req,res)=>{
    let products=await product.find()
    res.status(200).json(products);

});

app.delete("/api/products/:id",(req,res)=>{
    const {id} = req.params;
    const index = products.findIndex((p) => p.Id === id);

     if (index === -1) {
        return res.status(404).json({ message: "product not found."});

     }

     const deleted = products.splice(index, 1);
     res.status(200).json({
        message: "product deleted successfully!",
        deleted: deleted[0],
     });
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));