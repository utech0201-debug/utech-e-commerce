"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type OrderMethod = "utech_checkout" | "whatsapp" | "hybrid";

export default function SellerSettingsPage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState("");
  const [method, setMethod] = useState<OrderMethod>("utech_checkout");
  const [whatsapp, setWhatsapp] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/auth/login?next=/seller/settings");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("sellers")
        .select("id, order_method, whatsapp_number, order_instructions")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (loadError || !data) {
        setError("Seller account not found.");
      } else {
        setSellerId(data.id);
        setMethod((data.order_method ?? "utech_checkout") as OrderMethod);
        setWhatsapp(data.whatsapp_number ?? "");
        setInstructions(data.order_instructions ?? "");
      }
      setLoading(false);
    }

    void load();
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const { error: updateError } = await supabase
      .from("sellers")
      .update({
        order_method: method,
        whatsapp_number: whatsapp.trim() || null,
        order_instructions: instructions.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Order settings saved.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <section className="section auth-section">
        <div className="container auth-container">
          <div className="auth-card"><p>Loading seller settings...</p></div>
        </div>
      </section>
    );
  }

  return (
    <section className="section auth-section">
      <div className="container auth-container">
        <div className="auth-card">
          <span className="eyebrow">SELLER CENTER</span>
          <h1>Order settings.</h1>
          <p>Choose how customers should start orders for your store.</p>

          <form className="auth-form" onSubmit={save}>
            <label>
              Order method
              <select value={method} onChange={(event) => setMethod(event.target.value as OrderMethod)}>
                <option value="utech_checkout">UTECH Checkout</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="hybrid">Hybrid — UTECH + WhatsApp</option>
              </select>
            </label>

            {(method === "whatsapp" || method === "hybrid") && (
              <label>
                WhatsApp number
                <input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="+233..."
                  inputMode="tel"
                  required
                />
              </label>
            )}

            <label>
              Customer instructions
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Example: Send your preferred delivery area after starting the order."
                rows={5}
              />
            </label>

            <p className="seller-field-help">
              UTECH Checkout keeps the order inside the marketplace and supports automatic seller earnings.
              WhatsApp is seller-managed; UTECH cannot automatically reconcile a WhatsApp sale until it is recorded through UTECH.
            </p>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-success">{message}</p>}

            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Order Settings"}
            </button>
          </form>

          <p className="auth-switch">
            <Link href="/seller/dashboard">← Back to Seller Dashboard</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
