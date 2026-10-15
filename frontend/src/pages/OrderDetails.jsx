import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";

const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  async function load() {
    const res = await api.get(`/orders/${id}`);
    setOrder(res.data.order);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function advanceStatus(nextStatus) {
    await api.patch(`/orders/${id}/status`, { status: nextStatus });
    load();
  }

  if (!order) return <p>Loading...</p>;

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="order-details-page">
      <h1>Order #{order._id}</h1>
      <p>Payment: {order.paymentStatus}</p>

      <div className="status-timeline">
        {STATUS_FLOW.map((step, index) => (
          <div key={step} className={`timeline-step ${index <= currentIndex ? "complete" : ""}`}>
            {step}
          </div>
        ))}
      </div>

      <div className="demo-status-progression">
        <h3>Demo Status Progression</h3>
        {STATUS_FLOW.map((step, index) => (
          <button key={step} onClick={() => advanceStatus(step)} disabled={index <= currentIndex}>
            Set {step}
          </button>
        ))}
      </div>

      <h2>Items</h2>
      <ul>
        {order.items.map((item) => (
          <li key={item.product}>{item.name} × {item.quantity} — ₹{item.price * item.quantity}</li>
        ))}
      </ul>
      <p className="total">Total: ₹{order.totalAmount}</p>

      <details className="gateway-reference-drawer">
        <summary>Gateway Reference Details</summary>
        <p>Razorpay Order ID: {order.razorpayOrderId}</p>
        <p>Razorpay Payment ID: {order.razorpayPaymentId || "—"}</p>
      </details>
    </div>
  );
}
