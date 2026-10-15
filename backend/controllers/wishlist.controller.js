import Customer from "../models/customer.model.js";

export async function getWishlist(req, res) {
  const customer = await Customer.findById(req.customerId).populate("wishlist");
  res.json({ wishlist: customer.wishlist });
}

export async function getWishlistCount(req, res) {
  const customer = await Customer.findById(req.customerId);
  res.json({ count: customer.wishlist.length });
}

export async function addToWishlist(req, res) {
  const customer = await Customer.findById(req.customerId);
  const { productId } = req.params;
  if (!customer.wishlist.some((id) => id.toString() === productId)) {
    customer.wishlist.push(productId);
    await customer.save();
  }
  res.json({ wishlist: customer.wishlist });
}

export async function removeFromWishlist(req, res) {
  const customer = await Customer.findById(req.customerId);
  const { productId } = req.params;
  customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);
  await customer.save();
  res.json({ wishlist: customer.wishlist });
}

export async function toggleWishlist(req, res) {
  const customer = await Customer.findById(req.customerId);
  const { productId } = req.params;
  const exists = customer.wishlist.some((id) => id.toString() === productId);
  if (exists) {
    customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);
  } else {
    customer.wishlist.push(productId);
  }
  await customer.save();
  res.json({ wishlist: customer.wishlist, inWishlist: !exists });
}
