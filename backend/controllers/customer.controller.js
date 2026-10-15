import bcrypt from "bcrypt";
import Customer from "../models/customer.model.js";
import { generateToken } from "../utils/generateToken.js";

function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ fullName, email, password: hashed, phone });

    const token = generateToken(customer._id);
    setTokenCookie(res, token);
    res.status(201).json({
      token,
      customer: { id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email: email?.toLowerCase() });
    if (!customer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, customer.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(customer._id);
    setTokenCookie(res, token);
    res.json({
      token,
      customer: { id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

export async function me(req, res) {
  const customer = await Customer.findById(req.customerId).select("-password");
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json({ customer });
}

export async function logout(req, res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });
  res.json({ message: "Logged out" });
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const customer = await Customer.findById(req.customerId);
    const match = await bcrypt.compare(oldPassword, customer.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Password update failed", error: err.message });
  }
}
