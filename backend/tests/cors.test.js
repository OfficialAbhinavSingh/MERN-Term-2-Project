import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../index.js";

describe("CORS allowlist", () => {
  const originalClientUrl = process.env.CLIENT_URL;

  beforeAll(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
  });

  afterAll(() => {
    process.env.CLIENT_URL = originalClientUrl;
  });

  it("reflects the configured client origin", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not reflect an arbitrary origin", async () => {
    const res = await request(app).get("/").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
