"use client";

import { FormEvent, useState } from "react";

const statuses = ["pending","confirmed","processing","ready","shipped","delivered","cancelled","returned"] as const;

type Props = {
  itemId: string;
  currentStatus: string;
  sellerNote?: string | null;
  trackingNumber?: string | null;
};

export default function SellerOrderActions({ itemId, currentStatus, sellerNote: initialNote, trackingNumber: initialTracking }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/seller/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        status,
        sellerNote: note || null,
        trackingNumber: tracking || null,
      }),
    });

    const result = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Saved." : result.error ?? "Could not save.");
  }

  return (
    <form className="seller-order-actions" onSubmit={submit}>
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Tracking / delivery reference" />
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Seller note for this order" rows={2} />
      <button className="button button-secondary" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Update order"}
      </button>
      {message && <span className="seller-field-help">{message}</span>}
    </form>
  );
}
