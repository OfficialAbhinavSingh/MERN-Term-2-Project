import Product from "../models/product.model.js";

export async function listProducts(req, res) {
  const { search, category, sort } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (category) filter.category = category;

  let query = Product.find(filter);
  if (sort === "price_asc") query = query.sort({ price: 1 });
  else if (sort === "price_desc") query = query.sort({ price: -1 });
  else query = query.sort({ createdAt: -1 });

  const products = await query.exec();
  res.json({ products });
}

export async function listCategories(req, res) {
  const categories = await Product.distinct("category");
  res.json({ categories });
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ product });
}

export async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ message: "Invalid product data", error: err.message });
  }
}
