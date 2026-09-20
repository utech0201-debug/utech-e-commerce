"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function Checkout() {
  const { items, subtotal } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const [submitted, setSubmitted] = useState(false);

  if (!items.length) {
    return (
      <section className="section">
        <div className="container">
          <span className="eyebrow">CHECKOUT</span>
          <h1 className="section-title">Your cart is empty</h1>
          <p className="section-copy">Add products before starting checkout.</p>
          <Link href="/shop" className="button button-primary" style={{ marginTop: 28 }}>
            Return to Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">CHECKOUT</span>
        <h1 className="section-title">Complete Your Order</h1>
        <p className="section-copy">
          Enter your delivery details, review your order, then continue to payment.
        </p>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <div className="checkout-card">
              <h2>Contact details</h2>
              <div className="form-grid">
                <label>Full name<input name="name" required placeholder="Your full name" /></label>
                <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
                <label>Phone<input name="phone" type="tel" required placeholder="+233 ..." /></label>
              </div>
            </div>

            <div className="checkout-card">
              <h2>Delivery address</h2>
              <div className="form-grid">
                <label className="full">Address<input name="address" required placeholder="Street address" /></label>
                <label>City<input name="city" required placeholder="Accra" /></label>
                <label>Country<input name="country" required defaultValue="Ghana" /></label>
              </div>
            </div>

            <div className="checkout-card">
              <h2>Payment</h2>
              <div className="payment-placeholder">
                <strong>Secure payment integration</strong>
                <p>
                  The storefront is ready for payment-provider integration. Card and
                  Mobile Money processing will be connected once the payment provider
                  credentials are configured.
                </p>
              </div>
            </div>

            {submitted && (
              <p className="checkout-notice" role="status">
                Your details are validated. Payment processing is the next integration step.
              </p>
            )}

            <button className="button button-primary" type="submit" disabled title="Enable after payment provider configuration">
              Continue to Payment
            </button>
          </form>

          <aside className="summary checkout-summary">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <div className="summary-row"><span>Items</span><strong>{count}</strong></div>
            <div className="summary-row"><span>Total</span><strong>${subtotal.toFixed(2)}</strong></div>
            <Link href="/cart" className="checkout-back">Back to Cart</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
