"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/data/products";

type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product) => void;
  remove: (id: string) => void;
  update: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "utech_cart";
const EMPTY_SNAPSHOT = "[]";
const listeners = new Set<() => void>();

function getSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  return window.localStorage.getItem(KEY) ?? EMPTY_SNAPSHOT;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = () => listener();
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}

function parseItems(snapshot: string): CartItem[] {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => parseItems(snapshot), [snapshot]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      add: (product) => {
        const next = items.some((item) => item.id === product.id)
          ? items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          : [...items, { ...product, quantity: 1 }];
        writeCart(next);
      },
      remove: (id) => writeCart(items.filter((item) => item.id !== id)),
      update: (id, quantity) =>
        writeCart(
          quantity < 1
            ? items.filter((item) => item.id !== id)
            : items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        ),
      clear: () => writeCart([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
