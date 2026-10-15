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
    fullName: "Wish Tester",
    email: "wish@example.com",
    password: "password123",
    phone: "9876543210",
  });
  token = registerRes.body.token;

  const product = await Product.create({ name: "Test Product", description: "desc", price: 100, category: "Test", image: "x.png", stock: 5 });
  productId = product._id.toString();
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("Wishlist", () => {
  it("rejects access without auth", async () => {
    const res = await request(app).get("/wishlist");
    expect(res.status).toBe(401);
  });

  it("starts empty", async () => {
    const res = await auth(request(app).get("/wishlist"));
    expect(res.status).toBe(200);
    expect(res.body.wishlist).toHaveLength(0);
  });

  it("adds a product to the wishlist", async () => {
    const res = await auth(request(app).post(`/wishlist/${productId}`));
    expect(res.status).toBe(200);
    expect(res.body.wishlist).toHaveLength(1);
  });

  it("increments the wishlist count", async () => {
    await auth(request(app).post(`/wishlist/${productId}`));
    const res = await auth(request(app).get("/wishlist/count"));
    expect(res.body.count).toBe(1);
  });

  it("removes a product from the wishlist", async () => {
    await auth(request(app).post(`/wishlist/${productId}`));
    const res = await auth(request(app).delete(`/wishlist/${productId}`));
    expect(res.body.wishlist).toHaveLength(0);
  });

  it("toggles a product in and out of the wishlist", async () => {
    const first = await auth(request(app).patch(`/wishlist/${productId}/toggle`));
    expect(first.body.inWishlist).toBe(true);
    const second = await auth(request(app).patch(`/wishlist/${productId}/toggle`));
    expect(second.body.inWishlist).toBe(false);
  });
});
