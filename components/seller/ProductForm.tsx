"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { containsRestrictedMarketplaceContent, marketplacePolicyNotice } from "@/lib/marketplace-policy";

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
  initialImageCount?: number;
};

const categories = ["Games", "Consoles", "Laptops", "Hardware", "Accessories", "Other"];
const MIN_IMAGES = 2;
const MAX_IMAGES = 10;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ sellerId, product, initialImageCount = 0 }: Props) {
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageCount, setImageCount] = useState(initialImageCount);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof Product, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleImages(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files);
    if (selected.length > MAX_IMAGES) {
      setError("You can select at most 10 product images at a time.");
      return;
    }

    if (imageCount + selected.length > MAX_IMAGES) {
      setError(`This product already has ${imageCount} image(s). You can add ${MAX_IMAGES - imageCount} more.`);
      return;
    }

    setError("");
    setImageFiles(selected);
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

    if (containsRestrictedMarketplaceContent(name, description, form.category)) {
      setError(marketplacePolicyNotice);
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

    const finalImageCount = imageCount + imageFiles.length;

    if (status === "pending" && finalImageCount < MIN_IMAGES) {
      setError(`Add at least ${MIN_IMAGES} product images before submitting for review. Front and back views are recommended.`);
      setSaving(false);
      return;
    }

    if (imageCount + imageFiles.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images.`);
      setSaving(false);
      return;
    }

    const draftPayload = {
      name,
      description,
      category: form.category,
      price,
      compare_at_price: compareAt,
      image_url: form.image_url.trim() || null,
      inventory,
      status: "draft" as const,
    };

    const result = product?.id
      ? await supabase.from("seller_products").update(draftPayload).eq("id", product.id).select("id").single()
      : await supabase.from("seller_products").insert({ seller_id: sellerId, slug, ...draftPayload }).select("id").single();

    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "That product URL is already in use. Change the product name slightly and try again."
          : result.error.code === "23514"
            ? marketplacePolicyNotice
            : result.error.message,
      );
      setSaving(false);
      return;
    }

    const productId = result.data?.id;
    let uploadedCount = 0;

    if (imageFiles.length > 0 && productId) {
      const uploadForm = new FormData();
      uploadForm.append("productId", productId);
      imageFiles.forEach((file) => uploadForm.append("images", file));

      const uploadResponse = await fetch("/api/seller/product-images", {
        method: "POST",
        body: uploadForm,
      });
      const uploadResult = await uploadResponse.json().catch(() => null);

      if (!uploadResponse.ok) {
        setError(uploadResult?.error ?? "Product saved as a draft, but the image upload failed. Try again.");
        setSaving(false);
        return;
      }

      uploadedCount = Number(uploadResult?.uploaded ?? imageFiles.length);
      setImageCount((current) => current + uploadedCount);
      setImageFiles([]);
    }

    if (status === "pending" && productId) {
      const reviewResult = await supabase
        .from("seller_products")
        .update({ status: "pending" })
        .eq("id", productId)
        .select("id")
        .single();

      if (reviewResult.error) {
        setError(
          reviewResult.error.code === "42501"
            ? "Add at least 2 product images before submitting for review."
            : reviewResult.error.message,
        );
        setSaving(false);
        return;
      }
    }

    setMessage(
      status === "pending"
        ? "Product submitted for UTECH review."
        : uploadedCount > 0
          ? `Draft saved with ${imageCount + uploadedCount} product images.`
          : "Product saved as a draft.",
    );
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
          <span className="seller-field-help">Optional fallback image URL. Uploaded gallery images are used for the marketplace product gallery.</span>
        </label>

        <label className="seller-form-full">
          Product images
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(e) => handleImages(e.target.files)}
          />
          <span className="seller-field-help">
            {imageCount}/{MAX_IMAGES} images saved. At least {MIN_IMAGES} images are required for review. Front + back views are recommended. You can add side, detail, packaging or in-use views too. Maximum 5 MB per image.
          </span>
          {imageFiles.length > 0 && (
            <span className="seller-field-help">
              {imageFiles.length} new image{imageFiles.length === 1 ? "" : "s"} selected.
            </span>
          )}
        </label>

        <label className="seller-form-full">
          Description
          <textarea rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell customers what they are buying..." required />
        </label>
      </div>

      <p className="seller-field-help">{marketplacePolicyNotice} Every product must also pass UTECH review before it becomes public.</p>

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
