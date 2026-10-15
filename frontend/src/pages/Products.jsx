import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const { refreshCart, refreshWishlistCount } = useCart();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const loadProducts = useCallback(async () => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (sort) params.sort = sort;
    const res = await api.get("/products", { params });
    setProducts(res.data.products);
  }, [search, category, sort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    api.get("/products/categories").then((res) => setCategories(res.data.categories));
    api.get("/wishlist").then((res) => setWishlistIds(res.data.wishlist.map((p) => p._id)));
  }, []);

  async function toggleWishlist(productId) {
    const res = await api.patch(`/wishlist/${productId}/toggle`);
    setWishlistIds(res.data.wishlist.map((id) => (id.toString ? id.toString() : id)));
    refreshWishlistCount();
  }

  async function addToCart(productId) {
    await api.post(`/cart/${productId}`);
    refreshCart();
  }

  return (
    <div className="products-page">
      <h1>All Products</h1>
      <div className="filter-bar">
        <select value={category} onChange={(e) => setSearchParams({ search, category: e.target.value, sort })}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSearchParams({ search, category, sort: e.target.value })}>
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isWishlisted={wishlistIds.includes(product._id)}
            onToggleWishlist={toggleWishlist}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
}
