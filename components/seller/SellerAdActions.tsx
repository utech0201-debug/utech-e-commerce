"use client";

import { useState } from "react";

export default function SellerAdActions({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);

  async function update(next: "paused" | "pending") {
    setBusy(true);
    try {
      const response = await fetch("/api/seller/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (response.ok) setCurrent(next);
    } finally {
      setBusy(false);
    }
  }

  if (current === "approved") {
    return <button className="button button-secondary" type="button" disabled={busy} onClick={() => update("paused")}>{busy ? "Saving..." : "Pause"}</button>;
  }

  if (current === "paused") {
    return <button className="button button-secondary" type="button" disabled={busy} onClick={() => update("pending")}>{busy ? "Saving..." : "Request relaunch"}</button>;
  }

  return <span>{current}</span>;
}
