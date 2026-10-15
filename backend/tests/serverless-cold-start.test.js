import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Simulates a Vercel-style serverless import: index.js is imported directly
// (never run as `node index.js`), so `isMainModule` is false and no code
// outside the request pipeline ever calls connectDB.
describe("serverless cold start (no main-module entrypoint)", () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("connects to the database on the first request, not only via node index.js", async () => {
    expect(mongoose.connection.readyState).toBe(0);

    const { default: app } = await import("../index.js");
    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
