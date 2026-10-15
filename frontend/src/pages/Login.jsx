import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart, refreshWishlistCount } = useCart();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/customers/login", form);
      localStorage.setItem("token", res.data.token);
      await refreshCart();
      await refreshWishlistCount();
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Sign in to ShopKart</h1>
        {error && <p className="error-text">{error}</p>}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button type="submit">Sign In</button>
        <p>Need an account? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
