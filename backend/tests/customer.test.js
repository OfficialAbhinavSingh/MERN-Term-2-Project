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

const payload = { fullName: "Test User", email: "test@example.com", password: "password123", phone: "9876543210" };

describe("Customer auth", () => {
  it("registers a new customer", async () => {
    const res = await request(app).post("/customers/register").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.customer.email).toBe(payload.email);
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/customers/register").send(payload);
    const res = await request(app).post("/customers/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/customers/register").send(payload);
    const res = await request(app).post("/customers/login").send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/customers/register").send(payload);
    const res = await request(app).post("/customers/login").send({ email: payload.email, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects /me without a token", async () => {
    const res = await request(app).get("/customers/me");
    expect(res.status).toBe(401);
  });

  it("returns profile with a valid bearer token", async () => {
    const registerRes = await request(app).post("/customers/register").send(payload);
    const res = await request(app).get("/customers/me").set("Authorization", `Bearer ${registerRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.customer.email).toBe(payload.email);
  });

  it("rejects /me with a malformed token", async () => {
    const res = await request(app).get("/customers/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
