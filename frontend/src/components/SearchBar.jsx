import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "./Icons.jsx";

export default function SearchBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      if (value.trim()) {
        navigate(`/products?search=${encodeURIComponent(value.trim())}`);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [value, navigate]);

  return (
    <div className="search-bar">
      <SearchIcon />
      <input placeholder="Search products..." value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}
