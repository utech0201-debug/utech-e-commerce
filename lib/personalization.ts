import type { Product } from "@/data/products";

export type ViewedProduct = Pick<
  Product,
  "id" | "slug" | "name" | "price" | "category" | "type" | "image" | "description" | "featured" | "sellerId" | "sellerStoreSlug" | "sellerStoreName"
>;

export const RECENTLY_VIEWED_KEY = "utech-recently-viewed-v1";
export const RECENT_SEARCHES_KEY = "utech-recent-searches-v1";
export const WISHLIST_KEY = "utech-wishlist-v1";
export const MAX_RECENTLY_VIEWED = 12;
export const MAX_RECENT_SEARCHES = 8;
export const FOLLOWED_STORES_KEY = "utech-followed-stores-v1";
export const MAX_FOLLOWED_STORES = 20;
export const MAX_WISHLIST = 30;

export function toViewedProduct(product: Product): ViewedProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    category: product.category,
    type: product.type,
    image: product.image,
    description: product.description,
    featured: product.featured,
    sellerId: product.sellerId,
    sellerStoreSlug: product.sellerStoreSlug,
    sellerStoreName: product.sellerStoreName,
  };
}

export function readRecentlyViewed(): ViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(product: Product) {
  if (typeof window === "undefined") return;
  const item = toViewedProduct(product);
  const next = [item, ...readRecentlyViewed().filter((viewed) => viewed.id !== item.id)].slice(0, MAX_RECENTLY_VIEWED);
  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("utech-recently-viewed", { detail: next }));
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const normalized = query.trim().replace(/\s+/g, " ");
  if (normalized.length < 2) return;
  const next = [normalized, ...readRecentSearches().filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("utech-recent-searches", { detail: next }));
}

export type FollowedStore = { slug: string; name: string; logoUrl?: string | null };

export function readFollowedStores(): FollowedStore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOWED_STORES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function isStoreFollowed(slug: string) {
  return readFollowedStores().some((store) => store.slug === slug);
}

export function toggleFollowedStore(store: FollowedStore) {
  if (typeof window === "undefined") return false;
  const current = readFollowedStores();
  const exists = current.some((item) => item.slug === store.slug);
  const next = exists ? current.filter((item) => item.slug !== store.slug) : [store, ...current].slice(0, MAX_FOLLOWED_STORES);
  window.localStorage.setItem(FOLLOWED_STORES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("utech-followed-stores", { detail: next }));
  return !exists;
}

export function readWishlist(): ViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isWishlisted(productId: string) {
  return readWishlist().some((product) => product.id === productId);
}

export function toggleWishlist(product: Product) {
  if (typeof window === "undefined") return false;
  const current = readWishlist();
  const exists = current.some((item) => item.id === product.id);
  const next = exists
    ? current.filter((item) => item.id !== product.id)
    : [toViewedProduct(product), ...current].slice(0, MAX_WISHLIST);
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("utech-wishlist", { detail: next }));
  return !exists;
}

export function getRecommendedProducts(products: Product[], viewed: ViewedProduct[], limit = 8): Product[] {
  const viewedIds = new Set(viewed.map((item) => item.id));
  const categoryWeight = new Map<string, number>();
  const typeWeight = new Map<string, number>();
  const sellerWeight = new Map<string, number>();

  viewed.forEach((item, index) => {
    const recency = Math.max(1, viewed.length - index);
    categoryWeight.set(item.category, (categoryWeight.get(item.category) ?? 0) + recency * 4);
    typeWeight.set(item.type, (typeWeight.get(item.type) ?? 0) + recency * 2);
    if (item.sellerId) sellerWeight.set(item.sellerId, (sellerWeight.get(item.sellerId) ?? 0) + recency * 3);
  });

  return products
    .filter((product) => !viewedIds.has(product.id))
    .map((product) => {
      let score = Number(Boolean(product.featured));
      score += categoryWeight.get(product.category) ?? 0;
      score += typeWeight.get(product.type) ?? 0;
      if (product.sellerId) score += sellerWeight.get(product.sellerId) ?? 0;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || Number(Boolean(b.product.featured)) - Number(Boolean(a.product.featured)))
    .slice(0, limit)
    .map(({ product }) => product);
}

export function getContextualRecommendations(products: Product[], viewed: ViewedProduct, limit = 6): Product[] {
  return products
    .filter((product) => product.id !== viewed.id)
    .map((product) => {
      let score = 0;
      if (product.category === viewed.category) score += 8;
      if (product.type === viewed.type) score += 5;
      if (product.sellerId && viewed.sellerId && product.sellerId === viewed.sellerId) score += 4;
      if (product.featured) score += 1;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || Number(Boolean(b.product.featured)) - Number(Boolean(a.product.featured)))
    .slice(0, limit)
    .map(({ product }) => product);
}
