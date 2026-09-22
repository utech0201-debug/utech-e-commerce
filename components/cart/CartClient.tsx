"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartClient() {
  const { items, subtotal, count, update, remove, clear } = useCart();

  if (!items.length) {
    return (
      <div className="cart-empty-marketplace">
        <div className="cart-empty-icon"><ShoppingBag size={34} /></div>
        <h2>Your cart is empty</h2>
        <p>Find something you love and add it to your UTECH cart.</p>
        <Link href="/shop" className="button button-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-layout marketplace-cart-layout">
      <div className="cart-items-panel">
        <div className="cart-panel-head">
          <div><strong>Cart</strong><span>{count} item{count === 1 ? "" : "s"}</span></div>
          <button type="button" className="cart-clear-button" onClick={clear}>Clear cart</button>
        </div>
        <div className="cart-item-list">
          {items.map((item) => (
            <article className="cart-item marketplace-cart-item" key={item.cartItemId}>
              <Link href={"/products/" + item.slug} className="cart-thumb">
                <Image src={item.image} alt={item.name} fill sizes="110px" unoptimized={Boolean(item.sellerId)} />
              </Link>
              <div className="cart-item-main">
                <span className="product-type">{item.type}</span>
                <h3><Link href={"/products/" + item.slug}>{item.name}</Link></h3>
                {item.sellerStoreName && <Link className="cart-seller" href={"/store/" + item.sellerStoreSlug}>Sold by {item.sellerStoreName}</Link>}
                {item.selectedVariantLabel && (
                  <div className="cart-variant">
                    {item.selectedVariantLabel}
                    {item.selectedVariantAttributes && Object.entries(item.selectedVariantAttributes).length > 0
                      ? " · " + Object.entries(item.selectedVariantAttributes).map(([key, value]) => key + ": " + value).join(" · ")
                      : ""}
                  </div>
                )}
                <button type="button" className="cart-remove" onClick={() => remove(item.cartItemId)}><Trash2 size={14} /> Remove</button>
              </div>
              <div className="cart-item-price">
                <strong>${item.price.toFixed(2)}</strong>
                <div className="cart-qty-control">
                  <button type="button" aria-label={"Decrease quantity of " + item.name} onClick={() => update(item.cartItemId, item.quantity - 1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={"Increase quantity of " + item.name} onClick={() => update(item.cartItemId, item.quantity + 1)}><Plus size={14} /></button>
                </div>
                <strong className="cart-line-total">${(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>
        <Link href="/shop" className="cart-continue">← Continue shopping</Link>
      </div>
      <aside className="summary cart-summary-marketplace">
        <span className="eyebrow">ORDER SUMMARY</span>
        <h2>Review your cart</h2>
        <div className="summary-row"><span>Items</span><strong>{count}</strong></div>
        <div className="summary-row"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
        <div className="cart-summary-note">Delivery and payment details are confirmed at checkout.</div>
        <Link href="/checkout" className="button button-primary cart-checkout-button">Checkout</Link>
      </aside>
    </div>
  );
}
