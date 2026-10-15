import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/products").then((res) => setFeatured(res.data.products.slice(0, 8)));
    api.get("/products/categories").then((res) => setCategories(res.data.categories));
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Shop smarter with ShopKart</h1>
        <Link to="/products" className="cta-button">Browse All Products</Link>
      </section>
      <section className="category-circles">
        {categories.map((c) => (
          <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="category-circle">
            {c}
          </Link>
        ))}
      </section>
      <section>
        <h2>Trending Now</h2>
        <div className="product-grid">
          {featured.map((product) => (
            <Link key={product._id} to={`/products/${product._id}`} className="product-card-mini">
              <img src={product.image} alt={product.name} />
              <p>{product.name}</p>
              <p className="price">₹{product.price}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
