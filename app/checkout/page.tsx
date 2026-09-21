"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { supabase } from "@/lib/supabaseClient";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          address: String(formData.get("address") || ""),
          city: String(formData.get("city") || ""),
          country: String(formData.get("country") || ""),
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create your order.");
      }

      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(result.orderId)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create your order.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">CHECKOUT</span>
        <h1 className="section-title">Complete Your Order</h1>
        <p className="section-copy">
          Enter your delivery details to create your order securely.
        </p>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-card">
              <h2>Contact details</h2>
              <div className="form-grid">
                <label>
                  Full name
                  <input name="name" required placeholder="Your full name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required placeholder="you@example.com" />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" required placeholder="+233 ..." />
                </label>
              </div>
            </div>

            <div className="checkout-card">
              <h2>Delivery address</h2>
              <div className="form-grid">
                <label className="full">
                  Address
                  <input name="address" required placeholder="Street address" />
                </label>
                <label>
                  City
                  <input name="city" required placeholder="Accra" />
                </label>
                <label>
                  Country
                  <input name="country" required defaultValue="Ghana" />
                </label>
              </div>
            </div>

            <div className="checkout-card">
              <h2>Payment</h2>
              <div className="payment-placeholder">
                <strong>Order creation is live</strong>
                <p>
                  Your order will be saved securely first. Payment provider integration
                  will be connected in the next step.
                </p>
              </div>
            </div>

            {error && (
              <p className="checkout-notice" role="alert">
                {error}
              </p>
            )}

            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Order..." : "Create Order"}
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
