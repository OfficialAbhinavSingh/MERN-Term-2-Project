import { Link } from "react-router-dom";
import { HeartIcon } from "./Icons.jsx";

export default function ProductCard({ product, isWishlisted, onToggleWishlist, onAddToCart }) {
  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`}>
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x400?text=ShopKart";
          }}
        />
        <h3>{product.name}</h3>
        <p className="price">₹{product.price}</p>
      </Link>
      <p className="stock-badge">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
      <div className="product-card-actions">
        <button onClick={() => onToggleWishlist(product._id)} aria-label="Toggle wishlist">
          <HeartIcon filled={isWishlisted} />
        </button>
        <button onClick={() => onAddToCart(product._id)} disabled={product.stock === 0}>
          Add to Bag
        </button>
      </div>
    </div>
  );
}
