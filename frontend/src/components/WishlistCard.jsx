export default function WishlistCard({ product, onMoveToBag, onRemove }) {
  return (
    <div className="wishlist-card">
      <img src={product.image} alt={product.name} onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400?text=ShopKart"; }} />
      <h3>{product.name}</h3>
      <p className="price">₹{product.price}</p>
      <div className="wishlist-card-actions">
        <button onClick={() => onMoveToBag(product._id)} disabled={product.stock === 0}>Move to Bag</button>
        <button onClick={() => onRemove(product._id)}>Remove</button>
      </div>
    </div>
  );
}
