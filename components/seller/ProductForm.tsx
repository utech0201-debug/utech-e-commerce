"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  compare_at_price: string;
  image_url: string;
  inventory: string;
  status?: string;
};

type Props = {
  sellerId: string;
  product?: Product;
};

const categories = ["Games", "Consoles", "Laptops", "Hardware", "Accessories", "Other"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ sellerId, product }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Product>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "Other",
    price: product?.price ?? "",
    compare_at_price: product?.compare_at_price ?? "",
    image_url: product?.image_url ?? "",
    inventory: product?.inventory ?? "0",
    status: product?.status,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof Product, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(status: "draft" | "pending") {
    setSaving(true);
    setError("");
    setMessage("");

    const name = form.name.trim();
    const description = form.description.trim();
    const slug = slugify(name);

    if (!name || !description || !slug) {
      setError("Add a product name and description first.");
      setSaving(false);
      return;
    }

    const price = Number(form.price);
    const inventory = Number(form.inventory);
    const compareAt = form.compare_at_price.trim() ? Number(form.compare_at_price) : null;

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid product price.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(inventory) || inventory < 0) {
      setError("Inventory must be a whole number of 0 or more.");
      setSaving(false);
      return;
    }

    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < price)) {
      setError("Compare-at price must be empty or greater than or equal to the selling price.");
      setSaving(false);
      return;
    }

    const payload = {
      name,
      description,
      category: form.category,
      price,
      compare_at_price: compareAt,
      image_url: form.image_url.trim() || null,
      inventory,
      status,
    };

    const result = product?.id
      ? await supabase.from("seller_products").update(payload).eq("id", product.id).select("id").single()
      : await supabase.from("seller_products").insert({ seller_id: sellerId, slug, ...payload }).select("id").single();

    if (result.error) {
      setError(result.error.code === "23505"
        ? "That product URL is already in use. Change the product name slightly and try again."
        : result.error.message);
      setSaving(false);
      return;
    }

    setMessage(status === "pending" ? "Product submitted for UTECH review." : "Product saved as a draft.");
    setSaving(false);

    setTimeout(() => router.push("/seller/dashboard"), 500);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void save("draft");
  }

  return (
    <form className="seller-product-form" onSubmit={submit}>
      <div className="seller-form-grid">
        <label className="seller-form-full">
          Product name
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. PlayStation 5 Slim" required />
        </label>

        <label>
          Category
          <select value={form.category} onChange={(e) => update("category", e.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>

        <label>
          Inventory
          <input type="number" min="0" step="1" value={form.inventory} onChange={(e) => update("inventory", e.target.value)} required />
        </label>

        <label>
          Price
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" required />
        </label>

        <label>
          Compare-at price
          <input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => update("compare_at_price", e.target.value)} placeholder="Optional" />
        </label>

        <label className="seller-form-full">
          Product image URL
          <input type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." />
          <span className="seller-field-help">Image uploads will be added with the marketplace storage system.</span>
        </label>

        <label className="seller-form-full">
          Description
          <textarea rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell customers what they are buying..." required />
        </label>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <div className="seller-form-actions">
        <button className="button button-secondary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button className="button button-primary" type="button" onClick={() => void save("pending")} disabled={saving}>
          {saving ? "Submitting..." : "Submit for Review"}
        </button>
      </div>
    </form>
  );
}
