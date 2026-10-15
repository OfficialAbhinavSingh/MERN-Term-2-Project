import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

vi.mock("../config/razorpay.js", () => ({
  getRazorpayInstance: () => ({
    orders: {
      create: async ({ amount }) => ({ id: "order_mock_123", amount }),
    },
  }),
}));

let mongod;
let token;
let productId;

const shippingAddress = {
  fullName: "Test Evaluator",
  phone: "9876543210",
  addressLine1: "Flat 401, Tech Park Avenue",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  process.env.RAZORPAY_KEY_SECRET = "test-razorpay-secret";
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  const registerRes = await request(app).post("/customers/register").send({
    fullName: "Order Tester",
    email: "order@example.com",
    password: "password123",
    phone: "9876543210",
  });
  token = registerRes.body.token;

  const product = await Product.create({ name: "Order Item", description: "desc", price: 500, category: "Test", image: "x.png", stock: 3 });
  productId = product._id.toString();

  await request(app).post(`/cart/${productId}`).set("Authorization", `Bearer ${token}`);
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("Order creation and payment", () => {
  it("rejects creating a payment order with a missing address field", async () => {
    const res = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress: { ...shippingAddress, pincode: "" } }));
    expect(res.status).toBe(400);
  });

  it("creates a payment order from the cart", async () => {
    const res = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    expect(res.status).toBe(201);
    expect(res.body.shopKartOrderId).toBeTruthy();
    expect(res.body.razorpayOrderId).toBe("order_mock_123");
  });

  it("verifies payment with a valid signature and decrements stock", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const { shopKartOrderId, razorpayOrderId } = createRes.body;
    const paymentId = "pay_mock_456";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    const res = await auth(
      request(app).post("/orders/verify-payment").send({
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      })
    );

    expect(res.status).toBe(200);
    expect(res.body.order.paymentStatus).toBe("PAID");
    expect(res.body.order.status).toBe("PLACED");

    const product = await Product.findById(productId);
    expect(product.stock).toBe(2);

    const customer = await Customer.findById(res.body.order.user);
    expect(customer.cart).toHaveLength(0);
  });

  it("rejects payment verification with a tampered signature and preserves the cart", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const { shopKartOrderId, razorpayOrderId } = createRes.body;

    const res = await auth(
      request(app).post("/orders/verify-payment").send({
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: "pay_mock_456",
        razorpay_signature: "tampered-signature",
      })
    );

    expect(res.status).toBe(400);

    const order = await Order.findById(shopKartOrderId);
    expect(order.paymentStatus).toBe("FAILED");

    const product = await Product.findById(productId);
    expect(product.stock).toBe(3);
  });

  it("lists and fetches orders for the authenticated customer", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));

    const listRes = await auth(request(app).get("/orders"));
    expect(listRes.body.orders).toHaveLength(1);

    const detailRes = await auth(request(app).get(`/orders/${createRes.body.shopKartOrderId}`));
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.order._id).toBe(createRes.body.shopKartOrderId);
  });

  it("advances order status through the valid flow", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const orderId = createRes.body.shopKartOrderId;

    const res = await auth(request(app).patch(`/orders/${orderId}/status`).send({ status: "CONFIRMED" }));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("CONFIRMED");
  });

  it("rejects an invalid status value", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const orderId = createRes.body.shopKartOrderId;

    const res = await auth(request(app).patch(`/orders/${orderId}/status`).send({ status: "TELEPORTED" }));
    expect(res.status).toBe(400);
  });
});
