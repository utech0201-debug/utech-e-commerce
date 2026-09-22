"use client";

import { useState } from "react";

type Props = { order: { id: string; sellerName: string; source: string; customerName: string | null; customerPhone: string | null; grossAmount: number; sellerAmount: number; paymentStatus: string; reference: string | null; createdAt: string } };

export default function ExternalOrderModeration({ order }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function moderate(decision: "approve" | "reject") {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/marketplace/external-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, decision }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error ?? "Could not update the sale."); setBusy(false); return; }
    setMessage(decision === "approve" ? "Approved." : "Rejected.");
    setBusy(false);
  }

  return <article className="order-row"><div><strong>{order.sellerName} · ${order.grossAmount.toFixed(2)}</strong><span>{order.source} · seller earnings ${order.sellerAmount.toFixed(2)} · payment {order.paymentStatus}</span><span>{order.customerName || "Customer"}{order.customerPhone ? " · " + order.customerPhone : ""}</span><span>{order.reference ? "Reference: " + order.reference : "No external reference"} · {new Date(order.createdAt).toLocaleString()}</span></div><div className="seller-header-actions"><button className="button button-primary" type="button" disabled={busy} onClick={() => moderate("approve")}>Approve</button><button className="button button-secondary" type="button" disabled={busy} onClick={() => moderate("reject")}>Reject</button>{message && <span>{message}</span>}</div></article>;
}
