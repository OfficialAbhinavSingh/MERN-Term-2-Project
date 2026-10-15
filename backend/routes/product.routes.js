import { Router } from "express";
import { listProducts, listCategories, getProduct, createProduct } from "../controllers/product.controller.js";

const router = Router();

router.get("/", listProducts);
router.get("/categories", listCategories);
router.get("/:id", getProduct);
router.post("/", createProduct);

export default router;
