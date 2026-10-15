import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import Product from "./models/product.model.js";

dotenv.config();

const products = [
  { name: "4K Monitor 27-inch", description: "Ultra-slim 4K IPS monitor for work and gaming.", price: 18999, category: "Electronics", image: "https://placehold.co/400x400?text=Monitor", stock: 10 },
  { name: "Mechanical Keyboard", description: "RGB backlit mechanical gaming keyboard.", price: 2999, category: "Electronics", image: "https://placehold.co/400x400?text=Keyboard", stock: 25 },
  { name: "Wireless Mouse", description: "Precision wireless mouse with silent clicks.", price: 1499, category: "Electronics", image: "https://placehold.co/400x400?text=Mouse", stock: 30 },
  { name: "Fitness Smartwatch", description: "AMOLED display fitness tracking smartwatch.", price: 3499, category: "Electronics", image: "https://placehold.co/400x400?text=Watch", stock: 15 },
  { name: "Wireless Headphones", description: "Over-ear studio wireless headphones.", price: 4999, category: "Audio", image: "https://placehold.co/400x400?text=Headphones", stock: 12 },
  { name: "Bluetooth Speaker", description: "Portable waterproof bluetooth speaker.", price: 2499, category: "Audio", image: "https://placehold.co/400x400?text=Speaker", stock: 20 },
  { name: "Noise-Cancelling Earbuds", description: "True wireless earbuds with ANC.", price: 3999, category: "Audio", image: "https://placehold.co/400x400?text=Earbuds", stock: 18 },
  { name: "Denim Jacket", description: "Classic vintage denim jacket, unisex fit.", price: 2499, category: "Fashion", image: "https://placehold.co/400x400?text=Jacket", stock: 22 },
  { name: "Running Shoes", description: "Lightweight breathable running shoes.", price: 3299, category: "Fashion", image: "https://placehold.co/400x400?text=Shoes", stock: 28 },
  { name: "Polarized Sunglasses", description: "Minimalist polarized UV-protection sunglasses.", price: 1799, category: "Fashion", image: "https://placehold.co/400x400?text=Sunglasses", stock: 35 },
  { name: "Laptop Backpack", description: "Canvas commuter laptop backpack.", price: 2199, category: "Fashion", image: "https://placehold.co/400x400?text=Backpack", stock: 20 },
  { name: "LED Desk Lamp", description: "Dimmable architect-style LED desk lamp.", price: 1899, category: "Home & Living", image: "https://placehold.co/400x400?text=Lamp", stock: 16 },
  { name: "Pour-Over Coffee Set", description: "Ceramic pour-over coffee brewer set.", price: 1599, category: "Home & Living", image: "https://placehold.co/400x400?text=Coffee", stock: 14 },
  { name: "Aroma Diffuser", description: "Ultrasonic essential oil aroma diffuser.", price: 1299, category: "Home & Living", image: "https://placehold.co/400x400?text=Diffuser", stock: 24 },
  { name: "The Pragmatic Programmer", description: "20th anniversary edition software craftsmanship book.", price: 1299, category: "Books & Media", image: "https://placehold.co/400x400?text=Book", stock: 40 },
  { name: "Atomic Habits", description: "James Clear's bestseller on building good habits.", price: 699, category: "Books & Media", image: "https://placehold.co/400x400?text=Book2", stock: 50 },
];

async function seed() {
  const dbUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";
  await connectDB(dbUrl);
  console.log("Connected to MongoDB for seeding...");
  await Product.deleteMany({});
  console.log("Cleared existing products.");
  await Product.insertMany(products);
  console.log(`Successfully seeded ${products.length} products across all categories!`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
