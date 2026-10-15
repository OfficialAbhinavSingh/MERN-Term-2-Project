import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cart.controller.js";

const router = Router();

router.use(isAuthenticated);
router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

export default router;
