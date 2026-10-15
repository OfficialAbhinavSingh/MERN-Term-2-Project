import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCart([]);
      return;
    }
    const res = await api.get("/cart");
    setCart(res.data.cart);
  }, []);

  const refreshWishlistCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishlistCount(0);
      return;
    }
    const res = await api.get("/wishlist/count");
    setWishlistCount(res.data.count);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, wishlistCount, refreshCart, refreshWishlistCount, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
