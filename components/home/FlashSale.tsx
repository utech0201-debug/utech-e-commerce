"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketplaceFlashSaleItem } from "@/lib/marketplace";

function SaleCard({ item }: { item: MarketplaceFlashSaleItem }) {
  const discount = item.originalPrice > 0 ? Math.round((1 - item.salePrice / item.originalPrice) * 100) : 0;
  return (
    <article className="flash-sale-card">
      <Link href={"/products/" + item.product.slug} className="flash-sale-image">
        <span className="flash-sale-badge">-{discount}%</span>
        <Image src={item.product.image} alt={item.product.name} fill sizes="(max-width:700px) 44vw, 190px" />
      </Link>
      <div className="flash-sale-body">
        <span className="flash-sale-type">{item.product.type}</span>
        <h3><Link href={"/products/" + item.product.slug}>{item.product.name}</Link></h3>
        <div className="flash-sale-prices">
          <strong>GH₵{item.salePrice.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <del>GH₵{item.originalPrice.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</del>
        </div>
        <div className="flash-sale-stock"><span><i style={{ width: "68%" }} /></span> Limited-time offer</div>
      </div>
    </article>
  );
}

export default function FlashSale({ items }: { items: MarketplaceFlashSaleItem[] }) {
  const [seconds, setSeconds] = useState(0);
  const endAt = items[0]?.endsAt ?? null;

  useEffect(() => {
    if (!endAt) return;
    const tick = () => setSeconds(Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endAt]);

  if (!items.length) return null;

  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const title = items[0].title;
  const uniqueItems = items.filter((item, index, all) => all.findIndex((other) => other.product.id === item.product.id) === index).slice(0, 8);

  return (
    <section className="flash-sale" aria-label="Flash sale">
      <div className="flash-sale-head">
        <div>
          <div className="flash-sale-title-row">
            <span className="flash-sale-lightning">⚡</span>
            <h2>Flash Sale</h2>
            <span className="flash-sale-preview">LIVE</span>
          </div>
          <p>{title} · Limited-time marketplace offers.</p>
        </div>
        <div className="flash-sale-countdown" aria-label={hours + " hours " + minutes + " minutes " + secs + " seconds remaining"}>
          <span>ENDS IN</span>
          <strong>{hours}:{minutes}:{secs}</strong>
        </div>
        <Link href="/shop" className="flash-sale-view">View all →</Link>
      </div>
      <div className="flash-sale-grid">
        {uniqueItems.map((item) => <SaleCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
