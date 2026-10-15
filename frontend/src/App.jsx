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
      </Routes>
    </CartProvider>
  );
}
