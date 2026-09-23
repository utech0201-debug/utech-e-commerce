"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";

type Props = { products: Product[] };

const categoryLabel: Record<Product["category"], string> = {
  games: "Games",
  consoles: "Gaming Consoles",
  laptops: "Laptops & Computers",
  hardware: "Hardware",
  fashion: "Fashion",
  accessories: "Accessories",
  other: "More to explore",
};

export default function ProductBillboard({ products }: Props) {
  const slides = useMemo(() => {
    const seen = new Set<string>();
    const pool = [...products.filter((product) => product.featured), ...products.filter((product) => !product.featured)];
    return pool.filter((product) => {
      if (seen.has(product.id) || !product.image) return false;
      seen.add(product.id);
      return true;
    }).slice(0, 8);
  }, [products]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  if (!slides.length) {
    return (
      <section className="product-billboard product-billboard-empty" aria-label="UTech Marketplace">
        <div>
          <span className="product-billboard-kicker">WELCOME TO UTECH</span>
          <h1>Shop tech, gaming and more.</h1>
          <p>Discover products from UTECH and independent sellers.</p>
          <Link href="/shop" className="button button-primary">Shop now</Link>
        </div>
      </section>
    );
  }

  const product = slides[active];

  return (
    <section className="product-billboard" aria-label="Featured products" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="product-billboard-copy">
        <span className="product-billboard-kicker">{categoryLabel[product.category]}</span>
        <p className="product-billboard-eyebrow">LIVE FROM THE UTECH MARKETPLACE</p>
        <h1>{product.name}</h1>
        <p className="product-billboard-description">{product.description}</p>
        <div className="product-billboard-price">
          <strong>${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <span>Available now</span>
        </div>
        <div className="product-billboard-actions">
          <Link href={`/products/${product.slug}`} className="button button-primary">View product</Link>
          <Link href="/shop" className="product-billboard-link">Browse marketplace →</Link>
        </div>
      </div>
      <div className="product-billboard-visual">
        <div className="product-billboard-glow" />
        <div className="product-billboard-orbit product-billboard-orbit-one" />
        <div className="product-billboard-orbit product-billboard-orbit-two" />
        <img key={product.id} src={product.image} alt={product.name} className="product-billboard-image" />
      </div>
      {slides.length > 1 ? (
        <>
          <button type="button" className="product-billboard-arrow product-billboard-prev" aria-label="Previous product" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}>‹</button>
          <button type="button" className="product-billboard-arrow product-billboard-next" aria-label="Next product" onClick={() => setActive((current) => (current + 1) % slides.length)}>›</button>
          <div className="product-billboard-dots" aria-label="Billboard slides">
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" aria-label={`Show ${slide.name}`} aria-current={index === active ? "true" : undefined} className={index === active ? "active" : ""} onClick={() => setActive(index)} />
            ))}
          </div>
        </>
      ) : null}
      <div className="product-billboard-progress" aria-hidden="true"><span key={product.id} /></div>
    </section>
  );
}