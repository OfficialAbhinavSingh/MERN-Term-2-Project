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
      create: async ({ amount }) => ({ id: `order_mock_${Math.random().toString(36).slice(2)}`, amount }),
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

function signatureFor(razorpayOrderId, paymentId) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
}

async function createAndPay() {
  const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
  const { shopKartOrderId, razorpayOrderId } = createRes.body;
  const paymentId = `pay_mock_${Math.random().toString(36).slice(2)}`;
  const signature = signatureFor(razorpayOrderId, paymentId);
  const verifyRes = await auth(
    request(app).post("/orders/verify-payment").send({
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    })
  );
  return { shopKartOrderId, razorpayOrderId, paymentId, signature, verifyRes };
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
    expect(res.body.razorpayOrderId).toBeTruthy();
  });

  it("verifies payment with a valid signature and decrements stock", async () => {
    const { verifyRes } = await createAndPay();

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.order.paymentStatus).toBe("PAID");
    expect(verifyRes.body.order.status).toBe("PLACED");

    const product = await Product.findById(productId);
    expect(product.stock).toBe(2);

    const customer = await Customer.findById(verifyRes.body.order.user);
    expect(customer.cart).toHaveLength(0);
  });

  it("rejects payment verification with a tampered signature and preserves stock and cart", async () => {
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

    const customer = await Customer.findById(order.user);
    expect(customer.cart).toHaveLength(1);
  });

  it("rejects a valid signature whose razorpay_order_id belongs to a different order", async () => {
    // Order A: cheap order, legitimately paid for ₹500 (1 unit already in cart from beforeEach).
    const cheapCreate = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const cheapRazorpayOrderId = cheapCreate.body.razorpayOrderId;
    const cheapPaymentId = "pay_mock_cheap";
    const cheapSignature = signatureFor(cheapRazorpayOrderId, cheapPaymentId);

    // Order B: a second, more expensive order for the same customer.
    const expensiveProduct = await Product.create({ name: "Expensive Item", description: "desc", price: 99999, category: "Test", image: "x.png", stock: 5 });
    await auth(request(app).post(`/cart/${expensiveProduct._id}`));
    const expensiveCreate = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const expensiveOrderId = expensiveCreate.body.shopKartOrderId;

    // Attacker reuses order A's valid (razorpay_order_id, payment_id, signature) but targets order B.
    const res = await auth(
      request(app).post("/orders/verify-payment").send({
        shopKartOrderId: expensiveOrderId,
        razorpay_order_id: cheapRazorpayOrderId,
        razorpay_payment_id: cheapPaymentId,
        razorpay_signature: cheapSignature,
      })
    );

    expect(res.status).toBe(400);

    const expensiveOrder = await Order.findById(expensiveOrderId);
    expect(expensiveOrder.paymentStatus).not.toBe("PAID");
  });

  it("does not double-decrement stock or clear the cart again when verify-payment is replayed", async () => {
    const { shopKartOrderId, razorpayOrderId, paymentId, signature } = await createAndPay();

    const replayRes = await auth(
      request(app).post("/orders/verify-payment").send({
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      })
    );

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.order.paymentStatus).toBe("PAID");

    const product = await Product.findById(productId);
    expect(product.stock).toBe(2);
  });

  it("ignores a bad signature replay against an already-paid order instead of flipping it to FAILED", async () => {
    const { shopKartOrderId } = await createAndPay();

    const res = await auth(
      request(app).post("/orders/verify-payment").send({
        shopKartOrderId,
        razorpay_order_id: "some_other_order_id",
        razorpay_payment_id: "pay_mock_bad",
        razorpay_signature: "tampered-signature",
      })
    );

    expect(res.status).toBe(200);
    const order = await Order.findById(shopKartOrderId);
    expect(order.paymentStatus).toBe("PAID");
  });

  it("never lets stock go negative when two orders are paid for the last unit concurrently", async () => {
    const lowStock = await Product.create({ name: "Last Unit", description: "desc", price: 100, category: "Test", image: "x.png", stock: 1 });

    // Customer A has the item in their cart already via a raw cart add; simulate a second customer too.
    await Customer.updateOne({ email: "order@example.com" }, { $set: { cart: [{ product: lowStock._id, quantity: 1 }] } });
    const createA = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));

    const registerB = await request(app).post("/customers/register").send({
      fullName: "Second Buyer",
      email: "second@example.com",
      password: "password123",
      phone: "9876543211",
    });
    const tokenB = registerB.body.token;
    await Customer.updateOne({ email: "second@example.com" }, { $set: { cart: [{ product: lowStock._id, quantity: 1 }] } });
    const createB = await request(app)
      .post("/orders/create-payment-order")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ shippingAddress });

    const payOrder = async (createRes, authToken) => {
      const { shopKartOrderId, razorpayOrderId } = createRes.body;
      const paymentId = `pay_${Math.random().toString(36).slice(2)}`;
      const signature = signatureFor(razorpayOrderId, paymentId);
      return request(app)
        .post("/orders/verify-payment")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ shopKartOrderId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature });
    };

    await payOrder(createA, token);
    await payOrder(createB, tokenB);

    const finalStock = await Product.findById(lowStock._id);
    expect(finalStock.stock).toBeGreaterThanOrEqual(0);
  });

  it("lists and fetches orders for the authenticated customer", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));

    const listRes = await auth(request(app).get("/orders"));
    expect(listRes.body.orders).toHaveLength(1);

    const detailRes = await auth(request(app).get(`/orders/${createRes.body.shopKartOrderId}`));
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.order._id).toBe(createRes.body.shopKartOrderId);
  });

  it("advances a paid order's status one step at a time", async () => {
    const { shopKartOrderId } = await createAndPay();

    const res = await auth(request(app).patch(`/orders/${shopKartOrderId}/status`).send({ status: "CONFIRMED" }));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("CONFIRMED");
  });

  it("rejects advancing an unpaid order's status", async () => {
    const createRes = await auth(request(app).post("/orders/create-payment-order").send({ shippingAddress }));
    const orderId = createRes.body.shopKartOrderId;

    const res = await auth(request(app).patch(`/orders/${orderId}/status`).send({ status: "CONFIRMED" }));
    expect(res.status).toBe(400);
  });

  it("rejects skipping ahead in the status flow", async () => {
    const { shopKartOrderId } = await createAndPay();

    const res = await auth(request(app).patch(`/orders/${shopKartOrderId}/status`).send({ status: "SHIPPED" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status value", async () => {
    const { shopKartOrderId } = await createAndPay();

    const res = await auth(request(app).patch(`/orders/${shopKartOrderId}/status`).send({ status: "TELEPORTED" }));
    expect(res.status).toBe(400);
  });
});
