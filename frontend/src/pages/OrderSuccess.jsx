import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api.js";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.order));
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="order-success-page">
      <h1>Thank you for your order!</h1>
      <p>Order reference: {order._id}</p>
      <p>Delivering to: {order.shippingAddress.addressLine1}, {order.shippingAddress.city}</p>
      <ul>
        {order.items.map((item) => (
          <li key={item.product}>{item.name} × {item.quantity}</li>
        ))}
      </ul>
      <p className="total">Total paid: ₹{order.totalAmount}</p>
      <Link to={`/orders/${order._id}`}>Track your order</Link>
    </div>
  );
}
