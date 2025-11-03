import mongoose from "mongoose";

const ProductSchema=new mongoose.Schema({
    title:String,
    price:Number,
    image:String
})

const product=mongoose.model("product",ProductSchema)

export default product