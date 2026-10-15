import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import CartItem from "../components/CartItem.jsx";

const FREE_SHIPPING_THRESHOLD = 499;

export default function Cart() {
  const navigate = useNavigate();
  const { cart, refreshCart, setCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  async function increment(productId, currentQty, stock) {
    if (currentQty >= stock) return;
    const res = await api.patch(`/cart/${productId}`, { quantity: currentQty + 1 });
    setCart(res.data.cart);
  }

  async function decrement(productId, currentQty) {
    if (currentQty <= 1) {
      await removeItem(productId);
      return;
    }
    const res = await api.patch(`/cart/${productId}`, { quantity: currentQty - 1 });
    setCart(res.data.cart);
  }

  async function removeItem(productId) {
    const res = await api.delete(`/cart/${productId}`);
    setCart(res.data.cart);
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <p>Your shopping bag is empty.</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Shopping Bag</h1>
      {remainingForFreeShipping > 0 ? (
        <p className="shipping-banner">Add ₹{remainingForFreeShipping} more for free shipping!</p>
      ) : (
        <p className="shipping-banner">You qualify for free shipping!</p>
      )}
      {cart.map((item) => (
        <CartItem key={item.product._id} item={item} onIncrement={increment} onDecrement={decrement} onRemove={removeItem} />
      ))}
      <div className="cart-summary">
        <p>Subtotal: ₹{subtotal}</p>
        <button onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
      </div>
    </div>
  );
}
