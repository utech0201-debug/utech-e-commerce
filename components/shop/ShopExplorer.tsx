"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product, ProductCategory } from "@/data/products";

const filters: Array<{ label: string; value: "all" | ProductCategory }> = [
  { label: "All", value: "all" },
  { label: "Games", value: "games" },
  { label: "Consoles", value: "consoles" },
  { label: "Laptops", value: "laptops" },
  { label: "Hardware", value: "hardware" },
];

export default function ShopExplorer({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery =
        !normalized ||
        [product.name, product.type, product.description, product.category]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <>
      <div className="shop-toolbar">
        <label className="search-box">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search consoles, laptops, hardware..."
          />
        </label>

        <div className="filter-list" aria-label="Product categories">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={category === filter.value ? "filter-button active" : "filter-button"}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <p className="results-count">
        Showing {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
      </p>

      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-results">
          <h2>No products found.</h2>
          <p>Try another search or choose a different category.</p>
        </div>
      )}
    </>
  );
}
