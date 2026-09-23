import type { Product } from "@/data/products";

export type ViewedProduct = Pick<
  Product,
  "id" | "slug" | "name" | "price" | "category" | "type" | "image" | "description" | "featured" | "sellerId" | "sellerStoreSlug" | "sellerStoreName"
>;

export const RECENTLY_VIEWED_KEY = "utech-recently-viewed-v1";
export const MAX_RECENTLY_VIEWED = 12;

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
