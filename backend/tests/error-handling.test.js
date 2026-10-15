import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index.js";
import Customer from "../models/customer.model.js";

let mongod;

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
});

describe("Invalid id handling", () => {
  it("returns 400, not a 500 crash, for a malformed product id", async () => {
    const res = await request(app).get("/products/not-a-valid-id");
    expect(res.status).toBe(400);
  });

  it("returns 400, not a 500 crash, for a malformed cart product id", async () => {
    const registerRes = await request(app).post("/customers/register").send({
      fullName: "Error Tester",
      email: "error@example.com",
      password: "password123",
      phone: "9876543210",
    });
    const res = await request(app)
      .post("/cart/not-a-valid-id")
      .set("Authorization", `Bearer ${registerRes.body.token}`);
    expect(res.status).toBe(400);
  });
});

describe("Deleted customer with a still-valid token", () => {
  it("returns 401 instead of crashing", async () => {
    const registerRes = await request(app).post("/customers/register").send({
      fullName: "Soon Deleted",
      email: "deleted@example.com",
      password: "password123",
      phone: "9876543210",
    });
    const token = registerRes.body.token;

    await Customer.deleteMany({ email: "deleted@example.com" });

    const res = await request(app).get("/cart").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
