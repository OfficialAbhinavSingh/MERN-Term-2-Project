import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

export async function getCart(req, res) {
  const customer = await Customer.findById(req.customerId).populate("cart.product");
  res.json({ cart: customer.cart });
}

export async function addToCart(req, res) {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const customer = await Customer.findById(req.customerId);
  const existing = customer.cart.find((item) => item.product.toString() === productId);

  if (existing) {
    if (existing.quantity + 1 > product.stock) {
      return res.status(400).json({ message: "Cannot exceed available stock" });
    }
    existing.quantity += 1;
  } else {
    if (product.stock < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }
    customer.cart.push({ product: productId, quantity: 1 });
  }

  await customer.save();
  await customer.populate("cart.product");
  res.json({ cart: customer.cart });
}

export async function updateCartItem(req, res) {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be a positive integer" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  if (quantity > product.stock) {
    return res.status(400).json({ message: "Cannot exceed available stock" });
  }

  const customer = await Customer.findById(req.customerId);
  const item = customer.cart.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ message: "Item not in cart" });
  }
  item.quantity = quantity;
  await customer.save();
  await customer.populate("cart.product");
  res.json({ cart: customer.cart });
}

export async function removeFromCart(req, res) {
  const { productId } = req.params;
  const customer = await Customer.findById(req.customerId);
  customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
  await customer.save();
  await customer.populate("cart.product");
  res.json({ cart: customer.cart });
}

export async function clearCart(req, res) {
  const customer = await Customer.findById(req.customerId);
  customer.cart = [];
  await customer.save();
  res.json({ cart: customer.cart });
}
