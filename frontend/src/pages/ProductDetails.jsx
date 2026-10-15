import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [added, setAdded] = useState(false);
  const { refreshCart } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data.product));
  }, [id]);

  async function handleAddToCart() {
    await api.post(`/cart/${id}`);
    await refreshCart();
    setAdded(true);
  }

  if (!product) return <p>Loading...</p>;

  return (
    <div className="product-details">
      <img src={product.image} alt={product.name} onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400?text=ShopKart"; }} />
      <div>
        <h1>{product.name}</h1>
        <p className="price">₹{product.price}</p>
        <p>{product.description}</p>
        <p className="stock-badge">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
        <button onClick={handleAddToCart} disabled={product.stock === 0}>
          {added ? "Added to Bag" : "Add to Shopping Bag"}
        </button>
      </div>
    </div>
  );
}
