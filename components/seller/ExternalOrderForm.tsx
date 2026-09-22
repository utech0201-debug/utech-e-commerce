"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = { id: string; name: string; price: number; inventory: number };
type Props = { products: Product[] };
type Line = { productId: string; quantity: number; unitPrice: number };

export default function ExternalOrderForm({ products }: Props) {
  const [lines, setLines] = useState<Line[]>([
    products[0] ? { productId: products[0].id, quantity: 1, unitPrice: products[0].price } : { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [source, setSource] = useState("whatsapp");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [sellerNote, setSellerNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [lines]);

  function changeProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    setLines((current) => current.map((line, i) => i === index ? { ...line, productId, unitPrice: product?.price ?? 0 } : line));
  }
  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  }
  function addLine() {
    if (!products.length) return;
    const product = products[0];
    setLines((current) => [...current, { productId: product.id, quantity: 1, unitPrice: product.price }]);
  }
  function removeLine(index: number) { setLines((current) => current.filter((_, i) => i !== index)); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const response = await fetch("/api/seller/external-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, paymentStatus, customerName, customerPhone, externalReference, sellerNote, items: lines }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Could not record the sale.");
      setSaving(false);
      return;
    }
    setMessage("Sale recorded. It is now waiting for UTECH verification before payout eligibility.");
    setCustomerName(""); setCustomerPhone(""); setExternalReference(""); setSellerNote("");
    setSaving(false);
  }

  return (
    <form className="seller-external-order-form" onSubmit={submit}>
      <div className="seller-form-grid">
        <label className="seller-field"><span>Sales channel</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="physical">Physical store</option><option value="other">Other</option></select></label>
        <label className="seller-field"><span>Payment status</span><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="paid">Paid</option><option value="pending">Pending</option></select></label>
        <label className="seller-field"><span>Customer name</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={160} /></label>
        <label className="seller-field"><span>Customer phone</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={80} /></label>
        <label className="seller-field"><span>External reference</span><input value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="WhatsApp/order reference" maxLength={160} /></label>
      </div>

      <div className="seller-external-items">
        <div className="account-card-heading"><h2>Products sold</h2><button type="button" className="button button-secondary" onClick={addLine} disabled={lines.length >= 50 || !products.length}>Add product</button></div>
        {lines.map((line, index) => {
          const product = products.find((item) => item.id === line.productId);
          return (
            <div className="seller-external-line" key={index}>
              <select value={line.productId} onChange={(event) => changeProduct(index, event.target.value)}>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.inventory} in stock</option>)}</select>
              <input type="number" min="1" max={product?.inventory ?? 1} value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
              <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
              <strong>${(line.quantity * line.unitPrice).toFixed(2)}</strong>
              {lines.length > 1 && <button type="button" className="button button-secondary" onClick={() => removeLine(index)}>Remove</button>}
            </div>
          );
        })}
      </div>

      <label className="seller-field"><span>Seller note</span><textarea value={sellerNote} onChange={(event) => setSellerNote(event.target.value)} rows={4} maxLength={2000} placeholder="Optional delivery or reconciliation note." /></label>
      <div className="seller-external-total"><span>Sale total</span><strong>${total.toFixed(2)}</strong></div>
      <p className="seller-field-help">External sales are recorded for accounting, but UTECH keeps them pending until an admin verifies the sale. Inventory is reduced atomically when the record is created.</p>
      {message && <p className="seller-form-message">{message}</p>}
      <button className="button button-primary" type="submit" disabled={saving || !products.length}>{saving ? "Recording..." : "Record external sale"}</button>
    </form>
  );
}
