import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

let mongod;
let token;
let productId;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
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

  const registerRes = await request(app).post("/customers/register").send({
    fullName: "Cart Tester",
    email: "cart@example.com",
    password: "password123",
    phone: "9876543210",
  });
  token = registerRes.body.token;

  const product = await Product.create({ name: "Limited Stock Item", description: "desc", price: 100, category: "Test", image: "x.png", stock: 2 });
  productId = product._id.toString();
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("Cart", () => {
  it("starts empty", async () => {
    const res = await auth(request(app).get("/cart"));
    expect(res.body.cart).toHaveLength(0);
  });

  it("adds a product to the cart", async () => {
    const res = await auth(request(app).post(`/cart/${productId}`));
    expect(res.status).toBe(200);
    expect(res.body.cart).toHaveLength(1);
    expect(res.body.cart[0].quantity).toBe(1);
  });

  it("increments quantity on repeated add, up to stock", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).post(`/cart/${productId}`));
    expect(res.body.cart[0].quantity).toBe(2);
  });

  it("rejects adding beyond available stock", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).post(`/cart/${productId}`));
    expect(res.status).toBe(400);
  });

  it("rejects updating quantity beyond stock", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).patch(`/cart/${productId}`).send({ quantity: 99 }));
    expect(res.status).toBe(400);
  });

  it("updates quantity within stock", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).patch(`/cart/${productId}`).send({ quantity: 2 }));
    expect(res.status).toBe(200);
    expect(res.body.cart[0].quantity).toBe(2);
  });

  it("removes a single item from the cart", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).delete(`/cart/${productId}`));
    expect(res.body.cart).toHaveLength(0);
  });

  it("clears the entire cart", async () => {
    await auth(request(app).post(`/cart/${productId}`));
    const res = await auth(request(app).delete("/cart"));
    expect(res.body.cart).toHaveLength(0);
  });
});
