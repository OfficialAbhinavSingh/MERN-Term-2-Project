import { Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function Placeholder({ label }) {
  return <div style={{ padding: 40 }}>{label}</div>;
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Placeholder label="Login (Task 8)" />} />
        <Route path="/register" element={<Placeholder label="Register (Task 8)" />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Placeholder label="Home (Task 9)" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </CartProvider>
  );
}
