import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

export async function isAuthenticated(req, res, next) {
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearerToken || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const exists = await Customer.exists({ _id: decoded.id });
    if (!exists) {
      return res.status(401).json({ message: "Customer not found" });
    }
    req.customerId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
