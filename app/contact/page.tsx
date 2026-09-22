"use client";

import Link from "next/link";
import styles from "./ContactPage.module.css";
import { useState, type FormEvent } from "react";

const topics = [
  ["order", "Order help"],
  ["seller", "Seller support"],
  ["product", "Product question"],
  ["account", "Account"],
  ["payment", "Payment"],
  ["general", "Something else"],
] as const;

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "We could not send your message.");
      event.currentTarget.reset();
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send your message.");
      setStatus("error");
    }
  }

  return (
    <section className={`section contact-page ${styles.page}`}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <span className="eyebrow">UTECH SUPPORT</span>
            <h1 className="section-title">Let&apos;s solve it together.</h1>
            <p className="section-copy">
              Questions about an order, seller account, product, payment, or the marketplace?
              Send the UTECH team a message and we&apos;ll have the right context from the start.
            </p>
          </div>
          <div className={styles.heroPanel}>
            <span>SUPPORT DESK</span>
            <strong>One message.<br />One clear next step.</strong>
            <p>Tell us what happened and what you need help with.</p>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.formCard}>
            <div className={styles.heading}>
              <div>
                <span className="eyebrow">SEND A MESSAGE</span>
                <h2>How can we help?</h2>
              </div>
              <span className={styles.secure}>Secure form</span>
            </div>

            <form className={styles.form} onSubmit={submit}>
              <div className={styles.grid}>
                <label>
                  Name
                  <input name="name" type="text" autoComplete="name" maxLength={120} placeholder="Your name" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
                </label>
                <label className={styles.full}>
                  What do you need help with?
                  <select name="topic" defaultValue="general">
                    {topics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="contact-form-full">
                  Message
                  <textarea name="message" rows={7} maxLength={4000} placeholder="Give us the details..." required />
                  <span className={styles.help}>For order issues, include the order number if you have it. Never send passwords or payment card details.</span>
                </label>
                <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              </div>

              {status === "success" && (
                <div className={styles.success} role="status">
                  <strong>Message received.</strong>
                  <span>Your request has been sent to the UTECH support queue.</span>
                </div>
              )}
              {status === "error" && <p className="auth-error" role="alert">{error}</p>}

              <div className={styles.actions}>
                <button className="button button-primary" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : "Send message"}
                </button>
                <span>We only use the details you provide to handle your support request.</span>
              </div>
            </form>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.infoCard}>
              <span className="eyebrow">BEFORE YOU MESSAGE</span>
              <h2>Get faster help.</h2>
              <div className={styles.check}>
                <strong>Order issue</strong>
                <span>Have your order number and the issue ready.</span>
              </div>
              <div className="contact-check">
                <strong>Seller support</strong>
                <span>Tell us your store name and what you are trying to do.</span>
              </div>
              <div className="contact-check">
                <strong>Product question</strong>
                <span>Include the product name or marketplace link.</span>
              </div>
              <div className="contact-check">
                <strong>Account or payment</strong>
                <span>Never send passwords, OTPs, PINs, or full card details.</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className="eyebrow">QUICK LINKS</span>
              <Link href="/shop"><strong>Browse the marketplace</strong><span>Explore products and sellers →</span></Link>
              <Link href="/sell"><strong>Start selling</strong><span>Apply for a UTECH seller account →</span></Link>
              <Link href="/account"><strong>Open your account</strong><span>Check your orders and profile →</span></Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
