export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  const product = item.product;
  return (
    <div className="cart-item">
      <img src={product.image} alt={product.name} onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400?text=ShopKart"; }} />
      <div className="cart-item-info">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price}</p>
      </div>
      <div className="quantity-stepper">
        <button onClick={() => onDecrement(product._id, item.quantity)}>-</button>
        <span>{item.quantity}</span>
        <button onClick={() => onIncrement(product._id, item.quantity, product.stock)} disabled={item.quantity >= product.stock}>+</button>
      </div>
      <button onClick={() => onRemove(product._id)} className="remove-button">Remove</button>
    </div>
  );
}
