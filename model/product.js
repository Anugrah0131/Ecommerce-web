import mongoose from "mongoose";

const productSchema= new mongoose.Schema({
    title:String,
    price:Number,
    image:String
})

const product=mongoose.model("product",productSchema)


export default product