import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index.js";
import Product from "../models/product.model.js";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany([
    { name: "Cheap Widget", description: "A widget", price: 10, category: "Widgets", image: "x.png", stock: 5 },
    { name: "Pricey Gadget", description: "A gadget", price: 100, category: "Gadgets", image: "y.png", stock: 2 },
  ]);
});

describe("Product catalog", () => {
  it("lists all products", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it("filters by search term", async () => {
    const res = await request(app).get("/products?search=widget");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Cheap Widget");
  });

  it("filters by category", async () => {
    const res = await request(app).get("/products?category=Gadgets");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("sorts by price ascending", async () => {
    const res = await request(app).get("/products?sort=price_asc");
    expect(res.body.products[0].name).toBe("Cheap Widget");
  });

  it("lists distinct categories", async () => {
    const res = await request(app).get("/products/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories.sort()).toEqual(["Gadgets", "Widgets"]);
  });

  it("gets a single product by id", async () => {
    const product = await Product.findOne({ name: "Cheap Widget" });
    const res = await request(app).get(`/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Cheap Widget");
  });

  it("returns 404 for a non-existent product id", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/products/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
