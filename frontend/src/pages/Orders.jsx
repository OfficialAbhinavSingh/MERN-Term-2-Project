import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders").then((res) => setOrders(res.data.orders));
  }, []);

  if (orders.length === 0) {
    return <p>You have no orders yet.</p>;
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.map((order) => (
        <Link key={order._id} to={`/orders/${order._id}`} className="order-row">
          <span>{order._id}</span>
          <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
          <span className={`payment-pill payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
          <span>₹{order.totalAmount}</span>
        </Link>
      ))}
    </div>
  );
}
