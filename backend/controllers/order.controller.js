import crypto from "crypto";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { getRazorpayInstance } from "../config/razorpay.js";

const REQUIRED_ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];

export async function createPaymentOrder(req, res) {
  try {
    const { shippingAddress } = req.body;
    for (const field of REQUIRED_ADDRESS_FIELDS) {
      if (!shippingAddress?.[field]) {
        return res.status(400).json({ message: `Shipping address field "${field}" is required` });
      }
    }

    const customer = await Customer.findById(req.customerId).populate("cart.product");
    if (!customer.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const items = [];
    let totalAmount = 0;

    for (const entry of customer.cart) {
      const product = await Product.findById(entry.product._id);
      if (!product || product.stock < entry.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${entry.product.name}` });
      }
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: entry.quantity,
        image: product.image,
      });
      totalAmount += product.price * entry.quantity;
    }

    const order = await Order.create({
      user: req.customerId,
      items,
      shippingAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create payment order", error: err.message });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.customerId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({ message: "Payment verification failed" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    }

    await Customer.updateOne({ _id: req.customerId }, { $set: { cart: [] } });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Payment verification error", error: err.message });
  }
}

export async function listOrders(req, res) {
  const orders = await Order.find({ user: req.customerId }).sort({ createdAt: -1 });
  res.json({ orders });
}

export async function getOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.customerId });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({ order });
}

const STATUS_FLOW = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.customerId });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = status;
  await order.save();
  res.json({ order });
}
