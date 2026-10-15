import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^\d{10,15}$/;

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, refreshCart, setCart } = useCart();
  const [address, setAddress] = useState({ fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "" });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  function handleChange(e) {
    setAddress({ ...address, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!PHONE_REGEX.test(address.phone)) return "Phone must be 10-15 digits";
    if (!PINCODE_REGEX.test(address.pincode)) return "Pincode must be exactly 6 digits";
    for (const field of ["fullName", "addressLine1", "city", "state"]) {
      if (!address[field]) return `${field} is required`;
    }
    return "";
  }

  async function handlePay() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setProcessing(true);

    try {
      const createRes = await api.post("/orders/create-payment-order", { shippingAddress: address });
      const { shopKartOrderId, razorpayOrderId, amount, key } = createRes.data;

      const options = {
        key,
        amount,
        currency: "INR",
        name: "ShopKart",
        order_id: razorpayOrderId,
        prefill: { name: address.fullName, contact: address.phone },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/orders/verify-payment", {
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setCart([]);
            await refreshCart();
            navigate(`/order-success/${verifyRes.data.order._id}`);
          } catch (err) {
            setError("Payment verification failed. Your cart has been preserved.");
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || "Could not start checkout");
      setProcessing(false);
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="checkout-page">
      <div className="checkout-form">
        <h1>Shipping Details</h1>
        {error && <p className="error-text">{error}</p>}
        <input name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleChange} required />
        <input name="phone" placeholder="Phone (10-15 digits)" value={address.phone} onChange={handleChange} required />
        <input name="addressLine1" placeholder="Street Address" value={address.addressLine1} onChange={handleChange} required />
        <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
        <input name="state" placeholder="State" value={address.state} onChange={handleChange} required />
        <input name="pincode" placeholder="Pincode (6 digits)" value={address.pincode} onChange={handleChange} required />
        <button onClick={handlePay} disabled={processing}>
          {processing ? "Processing..." : "Pay with Razorpay"}
        </button>
      </div>
      <div className="checkout-summary">
        <h2>Order Summary</h2>
        {cart.map((item) => (
          <div key={item.product._id} className="checkout-summary-item">
            <span>{item.product.name} × {item.quantity}</span>
            <span>₹{item.product.price * item.quantity}</span>
          </div>
        ))}
        <p className="total">Total: ₹{subtotal}</p>
      </div>
    </div>
  );
}
