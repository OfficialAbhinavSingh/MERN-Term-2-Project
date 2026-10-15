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

    // Already paid: treat as idempotent success, never re-process side effects
    // or let a stale/bad verification attempt flip a paid order to FAILED.
    if (order.paymentStatus === "PAID") {
      return res.json({ success: true, order });
    }

    // The signature only proves the (order_id, payment_id) pair came from Razorpay.
    // It does not prove it belongs to THIS order unless we check the id ourselves.
    if (razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({ message: "Payment does not match this order" });
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

    // Atomic PENDING -> PAID transition: only one concurrent request can win this.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: shopKartOrderId, user: req.customerId, paymentStatus: { $ne: "PAID" } },
      { $set: { paymentStatus: "PAID", status: "PLACED", razorpayPaymentId: razorpay_payment_id } },
      { returnDocument: "after" }
    );

    if (!paidOrder) {
      const current = await Order.findById(shopKartOrderId);
      return res.json({ success: true, order: current });
    }

    for (const item of paidOrder.items) {
      // Conditional decrement: never takes stock below 0, even under a race.
      await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
    }

    await Customer.updateOne({ _id: req.customerId }, { $set: { cart: [] } });

    res.json({ success: true, order: paidOrder });
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

  if (order.paymentStatus !== "PAID") {
    return res.status(400).json({ message: "Order must be paid before advancing status" });
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextIndex = STATUS_FLOW.indexOf(status);
  if (nextIndex !== currentIndex + 1) {
    return res.status(400).json({ message: "Status can only advance one step at a time" });
  }

  order.status = status;
  await order.save();
  res.json({ order });
}
