import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
  listOrders,
  getOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

router.use(isAuthenticated);
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;
