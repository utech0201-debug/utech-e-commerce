"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/data/products";
import { getRecommendedProducts, readRecentlyViewed, type ViewedProduct } from "@/lib/personalization";

const RECENT_EVENT = "utech-recently-viewed";

export default function PersonalizedDiscovery({ products }: { products: Product[] }) {
  const [viewed, setViewed] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const refresh = () => setViewed(readRecentlyViewed());
    refresh();
    window.addEventListener(RECENT_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENT_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const recentProducts = useMemo(() => {
    const catalog = new Map(products.map((product) => [product.id, product]));
    return viewed
      .map((item) => catalog.get(item.id) ?? item)
      .filter(Boolean)
      .slice(0, 6) as Product[];
  }, [products, viewed]);

  const recommendations = useMemo(
    () => getRecommendedProducts(products, viewed, 8),
    [products, viewed],
  );

  if (!recentProducts.length && !recommendations.length) return null;

  return (
    <>
      {recentProducts.length > 0 && (
        <section className="section personalized-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">YOUR ACTIVITY</span>
              <h2>Recently viewed</h2>
              <p>Pick up where you left off.</p>
            </div>
            <a href="/shop">Keep shopping →</a>
          </div>
          <div className="product-grid personalized-grid">
            {recentProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="section personalized-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">JUST FOR YOU</span>
              <h2>Recommended for you</h2>
              <p>Suggestions based on what you have been exploring.</p>
            </div>
            <a href="/shop">Explore more →</a>
          </div>
          <div className="product-grid personalized-grid">
            {recommendations.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}
    </>
  );
}
