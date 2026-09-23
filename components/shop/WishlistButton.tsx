"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { isWishlisted, toggleWishlist } from "@/lib/personalization";

const WISHLIST_EVENT = "utech-wishlist";

export default function WishlistButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setSaved(isWishlisted(product.id));
    refresh();
    window.addEventListener(WISHLIST_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [product.id]);

  return (
    <button
      type="button"
      className={compact ? "wishlist-button wishlist-button-compact" : "wishlist-button"}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      aria-pressed={saved}
      title={saved ? "Saved to wishlist" : "Save to wishlist"}
      onClick={() => setSaved(toggleWishlist(product))}
    >
      <Heart size={compact ? 17 : 19} fill={saved ? "currentColor" : "none"} />
      {!compact && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
