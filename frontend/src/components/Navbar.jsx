import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { CartIcon, HeartIcon } from "./Icons.jsx";
import SearchBar from "./SearchBar.jsx";
import api from "../services/api.js";

export default function Navbar() {
  const navigate = useNavigate();
  const { cartCount, wishlistCount } = useCart();
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  async function handleLogout() {
    try {
      await api.post("/customers/logout");
    } catch (err) {
      // backend session clear failed or was unreachable; still clear client state below
    }
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/home" className="navbar-brand">ShopKart</Link>
      <SearchBar />
      <div className="navbar-links">
        <Link to="/products">All Products</Link>
        <Link to="/wishlist" className="navbar-icon-link">
          <HeartIcon filled={wishlistCount > 0} />
          {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
        </Link>
        <Link to="/cart" className="navbar-icon-link">
          <CartIcon />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </Link>
        <Link to="/orders">My Orders</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
