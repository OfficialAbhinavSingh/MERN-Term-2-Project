import { Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";

function AuthedLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<ProtectedRoute><AuthedLayout><Home /></AuthedLayout></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><AuthedLayout><Products /></AuthedLayout></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><AuthedLayout><ProductDetails /></AuthedLayout></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><AuthedLayout><Cart /></AuthedLayout></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><AuthedLayout><Wishlist /></AuthedLayout></ProtectedRoute>} />
      </Routes>
    </CartProvider>
  );
}
