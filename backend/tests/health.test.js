import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../index.js";

describe("GET /", () => {
  it("returns a running message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/running/i);
  });
});
