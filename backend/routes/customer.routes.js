import { Router } from "express";
import { register, login, me, logout, changePassword } from "../controllers/customer.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", isAuthenticated, me);
router.post("/logout", isAuthenticated, logout);
router.patch("/change-password", isAuthenticated, changePassword);

export default router;
