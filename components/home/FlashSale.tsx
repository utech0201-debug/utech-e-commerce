"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";

const saleProducts = (products: Product[]) => products.slice(0, 6);

function SaleCard({ product, index }: { product: Product; index: number }) {
  const discount = [20, 25, 15, 30, 18, 22][index] ?? 20;
  const salePrice = product.price * (1 - discount / 100);

  return (
    <article className="flash-sale-card">
      <Link href={"/products/" + product.slug} className="flash-sale-image">
        <span className="flash-sale-badge">-{discount}%</span>
        <Image src={product.image} alt={product.name} fill sizes="(max-width:700px) 44vw, 190px" />
      </Link>
      <div className="flash-sale-body">
        <span className="flash-sale-type">{product.type}</span>
        <h3><Link href={"/products/" + product.slug}>{product.name}</Link></h3>
        <div className="flash-sale-prices">
          <strong>${salePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <del>${product.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</del>
        </div>
        <div className="flash-sale-stock"><span><i style={{ width: `${Math.max(24, 76 - index * 8)}%` }} /></span> Selling fast</div>
      </div>
    </article>
  );
}

export default function FlashSale({ products }: { products: Product[] }) {
  const [seconds, setSeconds] = useState(2 * 60 * 60 + 47 * 60 + 18);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 2 * 60 * 60 + 47 * 60 + 18));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const items = saleProducts(products);

  return (
    <section className="flash-sale" aria-label="Flash sale">
      <div className="flash-sale-head">
        <div>
          <div className="flash-sale-title-row">
            <span className="flash-sale-lightning">⚡</span>
            <h2>Flash Sale</h2>
            <span className="flash-sale-preview">PREVIEW</span>
          </div>
          <p>Limited-time offers. Grab them before the timer runs out.</p>
        </div>
        <div className="flash-sale-countdown" aria-label={`${hours} hours ${minutes} minutes ${secs} seconds remaining`}>
          <span>ENDS IN</span>
          <strong>{hours}:{minutes}:{secs}</strong>
        </div>
        <Link href="/shop" className="flash-sale-view">View all →</Link>
      </div>

      {items.length ? (
        <div className="flash-sale-grid">
          {items.map((product, index) => <SaleCard key={product.id} product={product} index={index} />)}
        </div>
      ) : (
        <div className="flash-sale-empty">Flash-sale products will appear here.</div>
      )}
    </section>
  );
}
