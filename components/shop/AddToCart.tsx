"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import type { Product, ProductVariant } from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [added, setAdded] = useState(false);

  function addItem(variant?: ProductVariant) {
    if (variant && variant.inventory < 1) return;
    add(product, variant);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
    setOpen(false);
  }

  if (hasVariants) {
    return (
      <>
        <button className="add-button" type="button" onClick={() => setOpen(true)}>
          {added ? <><Check size={15} /> Added</> : "Select options"}
        </button>
        {open && (
          <div className="variant-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}>
            <div className="variant-modal" role="dialog" aria-modal="true" aria-label={"Select options for " + product.name}>
              <div className="variant-modal-head">
                <div><span className="product-type">SELECT OPTIONS</span><h3>{product.name}</h3></div>
                <button type="button" className="variant-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
              </div>
              <p className="variant-help">Choose the size, color or other option before adding this item to your cart.</p>
              <div className="variant-list">
                {variants.map((variant) => {
                  const disabled = variant.inventory < 1;
                  const active = selected?.id === variant.id;
                  return (
                    <button type="button" key={variant.id} className={"variant-option" + (active ? " active" : "")} disabled={disabled} onClick={() => setSelected(variant)}>
                      <span><strong>{variant.label}</strong>{Object.entries(variant.attributes).length > 0 && <small>{Object.entries(variant.attributes).map(([key, value]) => key + ": " + value).join(" · ")}</small>}</span>
                      <span><strong>{"$" + variant.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong><small>{disabled ? "Out of stock" : variant.inventory + " available"}</small></span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="button button-primary variant-confirm" disabled={!selected || selected.inventory < 1} onClick={() => selected && addItem(selected)}>
                Add selected option to cart
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return <button className="add-button" type="button" onClick={() => addItem()}>{added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add to Cart</>}</button>;
}
