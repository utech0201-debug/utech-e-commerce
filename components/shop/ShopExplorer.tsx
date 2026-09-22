"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product, ProductCategory } from "@/data/products";

const filters: Array<{ label: string; value: "all" | ProductCategory }> = [
  { label: "All", value: "all" },
  { label: "Games", value: "games" },
  { label: "Consoles", value: "consoles" },
  { label: "Laptops", value: "laptops" },
  { label: "Hardware", value: "hardware" },
];

type Sort = "featured" | "price-low" | "price-high" | "name";

export default function ShopExplorer({ products, initialQuery = "" }: { products: Product[]; initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query") ?? "";
  const urlCategory = searchParams.get("category") as "all" | ProductCategory | null;
  const [query, setQuery] = useState(initialQuery || urlQuery);
  const [category, setCategory] = useState<"all" | ProductCategory>(urlCategory && filters.some(f => f.value === urlCategory) ? urlCategory : "all");
  const [sort, setSort] = useState<Sort>("featured");
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => { setQuery(initialQuery || urlQuery); }, [initialQuery, urlQuery]);
  useEffect(() => {
    if (urlCategory && filters.some(f => f.value === urlCategory)) setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("query") ?? "";
      const next = query.trim();
      if (current === next) return;
      const params = new URLSearchParams(searchParams.toString());
      next ? params.set("query", next) : params.delete("query");
      router.replace(params.toString() ? `${pathname}?${params}` : pathname);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname, query, router, searchParams]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter(product => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery = !normalized || [product.name, product.type, product.description, product.category, product.sellerStoreName ?? ""].join(" ").toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
    return [...filtered].sort((a,b) => sort === "price-low" ? a.price-b.price : sort === "price-high" ? b.price-a.price : sort === "name" ? a.name.localeCompare(b.name) : Number(Boolean(b.featured))-Number(Boolean(a.featured)));
  }, [category, products, query, sort]);

  const updateCategory = (value: "all" | ProductCategory) => {
    setCategory(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("category"); else params.set("category", value);
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
    setMobileFilters(false);
  };

  return (
    <div className="shop-explorer">
      <div className="shop-mobile-filter-bar">
        <button className="button button-secondary" type="button" onClick={() => setMobileFilters(true)}><SlidersHorizontal size={17}/> Filters</button>
        <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort products">
          <option value="featured">Featured</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name: A-Z</option>
        </select>
      </div>

      {mobileFilters && <div className="shop-filter-overlay" role="dialog" aria-modal="true" aria-label="Product filters">
        <div className="shop-filter-sheet">
          <div className="shop-filter-head"><strong>Filters</strong><button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters"><X size={20}/></button></div>
          <div className="filter-list mobile-filter-list">{filters.map(filter => <button key={filter.value} type="button" className={category === filter.value ? "filter-button active" : "filter-button"} onClick={() => updateCategory(filter.value)}>{filter.label}</button>)}</div>
        </div>
      </div>}

      <div className="shop-layout">
        <aside className="shop-sidebar">
          <div className="shop-sidebar-title">Categories</div>
          {filters.map(filter => <button key={filter.value} type="button" className={category === filter.value ? "shop-side-filter active" : "shop-side-filter"} onClick={() => updateCategory(filter.value)}>{filter.label}<span>{products.filter(p => filter.value === "all" || p.category === filter.value).length}</span></button>)}
        </aside>
        <div className="shop-results">
          <div className="shop-toolbar">
            <label className="search-box"><span className="sr-only">Search products</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, brands, stores..." /></label>
            <select className="shop-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort products">
              <option value="featured">Featured</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name: A-Z</option>
            </select>
          </div>
          <div className="shop-result-meta"><p>{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}{query.trim() ? <> for <strong>“{query.trim()}”</strong></> : null}</p>{category !== "all" || query ? <button type="button" onClick={() => { setQuery(""); updateCategory("all"); }}>Clear all</button> : null}</div>
          {visibleProducts.length ? <div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-results"><h2>No products found.</h2><p>Try another search or choose a different category.</p></div>}
        </div>
      </div>
    </div>
  );
}
