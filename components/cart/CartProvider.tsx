"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product, ProductVariant } from "@/data/products";

export type CartItem = Product & {
  quantity: number;
  cartItemId: string;
  selectedVariantId?: string;
  selectedVariantLabel?: string;
  selectedVariantAttributes?: Record<string, string>;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, variant?: ProductVariant) => void;
  remove: (cartItemId: string) => void;
  update: (cartItemId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "utech_cart";
const EMPTY_SNAPSHOT = "[]";
const listeners = new Set<() => void>();

function getSnapshot() { if (typeof window === "undefined") return EMPTY_SNAPSHOT; return window.localStorage.getItem(KEY) ?? EMPTY_SNAPSHOT; }
function getServerSnapshot() { return EMPTY_SNAPSHOT; }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = () => listener();
  window.addEventListener("storage", handleStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", handleStorage); };
}
function writeCart(items: CartItem[]) { window.localStorage.setItem(KEY, JSON.stringify(items)); listeners.forEach((listener) => listener()); }
function parseItems(snapshot: string): CartItem[] { try { const parsed = JSON.parse(snapshot); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }

export function CartProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => parseItems(snapshot), [snapshot]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add: (product, variant) => {
      const cartItemId = variant ? product.id + "::" + variant.id : product.id;
      const next = items.some((item) => item.cartItemId === cartItemId)
        ? items.map((item) => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, price: variant?.price ?? product.price, quantity: 1, cartItemId, selectedVariantId: variant?.id, selectedVariantLabel: variant?.label, selectedVariantAttributes: variant?.attributes }];
      writeCart(next);
    },
    remove: (cartItemId) => writeCart(items.filter((item) => item.cartItemId !== cartItemId)),
    update: (cartItemId, quantity) => writeCart(quantity < 1 ? items.filter((item) => item.cartItemId !== cartItemId) : items.map((item) => item.cartItemId === cartItemId ? { ...item, quantity } : item)),
    clear: () => writeCart([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
