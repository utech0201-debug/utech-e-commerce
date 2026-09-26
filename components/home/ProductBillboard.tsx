"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import styles from "./ProductBillboard.module.css";

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
      <section className={`${styles.billboard} ${styles.empty}`} aria-label="UTech Marketplace">
        <div>
          <span className={styles.kicker}>WELCOME TO UTECH</span>
          <h1>Shop tech, gaming and more.</h1>
          <p>Discover products from UTECH and independent sellers.</p>
          <Link href="/shop" className="button button-primary">Shop now</Link>
        </div>
      </section>
    );
  }

  const product = slides[active];

  return (
    <section
      className={styles.billboard}
      aria-label="Featured products"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.copy}>
        <span className={styles.kicker}>{categoryLabel[product.category]}</span>
        <p className={styles.eyebrow}>LIVE FROM THE UTECH MARKETPLACE</p>
        <h1>{product.name}</h1>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.price}>
          <strong>${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <span>Available now</span>
        </div>
        <div className={styles.actions}>
          <Link href={`/products/${product.slug}`} className="button button-primary">View product</Link>
          <Link href="/shop" className={styles.link}>Browse marketplace →</Link>
        </div>
      </div>

      <div className={styles.visual}>
        <div className={styles.glow} />
        <div className={`${styles.orbit} ${styles.orbitOne}`} />
        <div className={`${styles.orbit} ${styles.orbitTwo}`} />
        <div className={styles.imageFrame}>
          <Image
            key={product.id}
            src={product.image}
            alt={product.name}
            width={560}
            height={360}
            sizes="(max-width: 760px) 40vw, 32vw"
            className={styles.image}
            priority={active === 0}
          />
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Previous product" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}>‹</button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next product" onClick={() => setActive((current) => (current + 1) % slides.length)}>›</button>
          <div className={styles.dots} aria-label="Billboard slides">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.name}`}
                aria-current={index === active ? "true" : undefined}
                className={index === active ? styles.active : ""}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className={styles.progress} aria-hidden="true"><span key={product.id} /></div>
    </section>
  );
}
