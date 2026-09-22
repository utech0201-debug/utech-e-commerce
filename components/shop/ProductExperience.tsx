"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "@/components/shop/AddToCart";
import type { Product } from "@/data/products";

export default function ProductExperience({ product, gallery }: { product: Product; gallery: string[] }) {
  const [active, setActive] = useState(0);
  const images = gallery.length ? gallery : [product.image].filter(Boolean);
  const whatsappUrl = product.whatsappNumber
    ? "https://wa.me/" + product.whatsappNumber.replace(/\D/g, "") + "?text=" +
      encodeURIComponent("Hi, I want to order " + product.name + " from " + (product.sellerStoreName ?? "your UTECH store") + ".")
    : null;

  return (
    <section className="detail">
      <div className="container detail-grid marketplace-detail">
        <div className="detail-image">
          <div className="marketplace-gallery">
            <div className="gallery-main">
              {images[active] ? (
                <Image src={images[active]} alt={product.name} fill sizes="(max-width:850px) 100vw, 55vw" unoptimized={Boolean(product.sellerId)} priority />
              ) : (
                <div className="storefront-product-placeholder"><span>{product.category}</span></div>
              )}
              {images.length > 1 && <span className="gallery-count">{active + 1} / {images.length}</span>}
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs" aria-label="Product images">
                {images.map((image, index) => (
                  <button type="button" key={image + index} className={index === active ? "gallery-thumb active" : "gallery-thumb"} onClick={() => setActive(index)} aria-label={"View image " + (index + 1)}>
                    <Image src={image} alt="" fill sizes="88px" unoptimized={Boolean(product.sellerId)} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="detail-copy marketplace-detail-copy">
          <div className="product-breadcrumbs">
            <Link href="/">Home</Link><span>›</span>
            <Link href={"/shop?category=" + product.category}>{product.category}</Link><span>›</span>
            <strong>{product.name}</strong>
          </div>
          <span className="eyebrow">{product.type}</span>
          <h1>{product.name}</h1>

          {product.sellerStoreSlug && (
            <div className="seller-summary">
              <div><span>Sold by</span><Link href={"/store/" + product.sellerStoreSlug}>{product.sellerStoreName}</Link></div>
              <Link href={"/store/" + product.sellerStoreSlug} className="seller-store-button">Visit store →</Link>
            </div>
          )}

          <div className="marketplace-price-row">
            <div className="price">{"$" + product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <span className="marketplace-availability">Available to order</span>
          </div>

          <p className="product-long-description">{product.description}</p>

          <div className="purchase-panel">
            {product.sellerId && product.orderMethod !== "utech_checkout" ? (
              <>
                <p>{product.orderInstructions || "This seller accepts orders through WhatsApp."}</p>
                {whatsappUrl && <a className="button button-primary purchase-button" target="_blank" rel="noreferrer" href={whatsappUrl}>Order via WhatsApp</a>}
                {product.orderMethod === "hybrid" && <AddToCart product={product} />}
              </>
            ) : <AddToCart product={product} />}
          </div>

          <div className="purchase-trust">
            <div><strong>✓</strong><span>Secure marketplace experience</span></div>
            <div><strong>✓</strong><span>Seller reviewed by UTECH</span></div>
            <div><strong>✓</strong><span>Support available</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
