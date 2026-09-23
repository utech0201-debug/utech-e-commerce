"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/data/products";
import {
  getContextualRecommendations,
  getRecommendedProducts,
  readRecentlyViewed,
  readWishlist,
  type ViewedProduct,
  readFollowedStores,
  getProductsFromFollowedStores,
  type FollowedStore,
} from "@/lib/personalization";

const RECENT_EVENT = "utech-recently-viewed";
const WISHLIST_EVENT = "utech-wishlist";
const FOLLOWED_STORES_EVENT = "utech-followed-stores";

export default function PersonalizedDiscovery({ products }: { products: Product[] }) {
  const [viewed, setViewed] = useState<ViewedProduct[]>([]);
  const [wishlist, setWishlist] = useState<ViewedProduct[]>([]);
  const [followedStores, setFollowedStores] = useState<FollowedStore[]>([]);

  useEffect(() => {
    const refresh = () => {
      setViewed(readRecentlyViewed());
      setWishlist(readWishlist());\n      setFollowedStores(readFollowedStores());
    };
    refresh();
    window.addEventListener(RECENT_EVENT, refresh);
    window.addEventListener(WISHLIST_EVENT, refresh);
    window.addEventListener(FOLLOWED_STORES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENT_EVENT, refresh);
      window.removeEventListener(WISHLIST_EVENT, refresh);
      window.removeEventListener(FOLLOWED_STORES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const catalog = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const recentProducts = useMemo(
    () => viewed.map((item) => catalog.get(item.id) ?? item).filter(Boolean).slice(0, 6) as Product[],
    [catalog, viewed],
  );

  const savedProducts = useMemo(
    () => wishlist.map((item) => catalog.get(item.id) ?? item).filter(Boolean).slice(0, 6) as Product[],
    [catalog, wishlist],
  );

  const followedProducts = useMemo(
    () => getProductsFromFollowedStores(products, followedStores, 8),
    [products, followedStores],
  );

  const recommendations = useMemo(
    () => getRecommendedProducts(products, viewed, 8),
    [products, viewed],
  );

  const contextual = useMemo(
    () => viewed[0] ? getContextualRecommendations(products, viewed[0], 6) : [],
    [products, viewed],
  );

  if (!recentProducts.length && !savedProducts.length && !recommendations.length && !contextual.length && !followedProducts.length) return null;

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

      {savedProducts.length > 0 && (
        <section className="section personalized-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">SAVED FOR LATER</span>
              <h2>Your wishlist</h2>
              <p>Products you want to keep an eye on.</p>
            </div>
            <a href="/shop">Find more →</a>
          </div>
          <div className="product-grid personalized-grid">
            {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {followedProducts.length > 0 && (
        <section className="section personalized-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">STORES YOU FOLLOW</span>
              <h2>New from stores you follow</h2>
              <p>Fresh products from the sellers you chose to keep close.</p>
            </div>
            <a href="/shop">Browse marketplace →</a>
          </div>
          <div className="product-grid personalized-grid">
            {followedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}\n\n      {contextual.length > 0 && viewed[0] && (
        <section className="section personalized-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">BASED ON YOUR BROWSING</span>
              <h2>Because you viewed {viewed[0].name}</h2>
              <p>More products from the same shopping path.</p>
            </div>
            <a href={`/shop?category=${viewed[0].category}`}>Explore this category →</a>
          </div>
          <div className="product-grid personalized-grid">
            {contextual.map((product) => <ProductCard key={product.id} product={product} />)}
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
