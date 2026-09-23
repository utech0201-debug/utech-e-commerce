"use client";

import { BellRing, BellOff, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

type AlertType = "price_drop" | "back_in_stock";

type AlertState = {
  price_drop: boolean;
  back_in_stock: boolean;
};

export default function ProductAlerts({ productId, inventory }: { productId: string; inventory: number }) {
  const [alerts, setAlerts] = useState<AlertState>({ price_drop: false, back_in_stock: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<AlertType | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/product-alerts?productId=" + encodeURIComponent(productId), { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setMessage("Sign in to save product alerts.");
          return null;
        }
        return response.ok ? response.json() : null;
      })
      .then((data) => {
        if (!active || !data) return;
        setAlerts(data.alerts ?? { price_drop: false, back_in_stock: false });
      })
      .catch(() => {
        if (active) setMessage("Alerts are temporarily unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [productId]);

  async function toggle(type: AlertType) {
    setBusy(type);
    setMessage("");
    const enabled = !alerts[type];
    try {
      const response = await fetch("/api/product-alerts", {
        method: enabled ? "POST" : "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, alertType: type }),
      });

      if (response.status === 401) {
        window.location.href = "/auth/login?next=" + encodeURIComponent(window.location.pathname);
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Could not update alert.");
        return;
      }

      setAlerts(data.alerts ?? { ...alerts, [type]: enabled });
    } catch {
      setMessage("Could not update alert. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return null;

  return (
    <div className="product-alerts" aria-label="Product alerts">
      <div className="product-alerts-heading">
        <div>
          <span className="eyebrow">PRICE & STOCK ALERTS</span>
          <strong>Never miss an update</strong>
        </div>
        <BellRing size={18} />
      </div>

      <div className="product-alert-grid">
        <button type="button" className={alerts.price_drop ? "product-alert active" : "product-alert"} onClick={() => void toggle("price_drop")} disabled={busy !== null}>
          {alerts.price_drop ? <BellOff size={18} /> : <TrendingDown size={18} />}
          <span><strong>{alerts.price_drop ? "Price-drop alert on" : "Alert me if price drops"}</strong><small>We'll notify you when the price falls.</small></span>
          <span className="product-alert-state">{busy === "price_drop" ? "Saving…" : alerts.price_drop ? "ON" : "OFF"}</span>
        </button>

        <button type="button" className={alerts.back_in_stock ? "product-alert active" : "product-alert"} onClick={() => void toggle("back_in_stock")} disabled={busy !== null || inventory > 0}>
          {alerts.back_in_stock ? <BellOff size={18} /> : <BellRing size={18} />}
          <span><strong>{alerts.back_in_stock ? "Restock alert on" : inventory > 0 ? "Currently in stock" : "Alert me when back in stock"}</strong><small>{inventory > 0 ? "This product is currently available." : "We'll notify you when stock returns."}</small></span>
          <span className="product-alert-state">{busy === "back_in_stock" ? "Saving…" : alerts.back_in_stock ? "ON" : inventory > 0 ? "READY" : "OFF"}</span>
        </button>
      </div>

      {message && <p className="product-alert-message">{message}</p>}
    </div>
  );
}
