import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import WishlistCard from "../components/WishlistCard.jsx";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const { refreshCart, refreshWishlistCount } = useCart();

  async function load() {
    const res = await api.get("/wishlist");
    setItems(res.data.wishlist);
  }

  useEffect(() => {
    load();
  }, []);

  async function moveToBag(productId) {
    await api.post(`/cart/${productId}`);
    await api.delete(`/wishlist/${productId}`);
    await refreshCart();
    await refreshWishlistCount();
    load();
  }

  async function remove(productId) {
    await api.delete(`/wishlist/${productId}`);
    await refreshWishlistCount();
    load();
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Your wishlist is empty.</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h1>Your Wishlist</h1>
      <div className="product-grid">
        {items.map((product) => (
          <WishlistCard key={product._id} product={product} onMoveToBag={moveToBag} onRemove={remove} />
        ))}
      </div>
    </div>
  );
}
