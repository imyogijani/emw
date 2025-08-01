// Demo page
// src/Components/Home/PopularCategories.jsx
import React, { useState, useEffect } from "react";

export default function PopularCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories"); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="popular-categories">
      <h3>E-Mall World Popular Categories 🥳</h3>
      <div className="category-grid">
        {categories.map((cat) => (
          <div className="category-card" key={cat.id}>
            <img src={cat.imageUrl} alt={cat.name} />
            <h4>{cat.name}</h4>
            <p>{cat.restaurants} Restaurants</p>
          </div>
        ))}
      </div>
    </div>
  );
}
