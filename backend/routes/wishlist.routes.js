import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getWishlist, getWishlistCount, addToWishlist, removeFromWishlist, toggleWishlist } from "../controllers/wishlist.controller.js";

const router = Router();

router.use(isAuthenticated);
router.get("/", getWishlist);
router.get("/count", getWishlistCount);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.patch("/:productId/toggle", toggleWishlist);

export default router;
